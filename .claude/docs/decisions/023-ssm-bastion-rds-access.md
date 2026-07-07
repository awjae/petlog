# Decision: RDS 수동 접근 — SSM Session Manager 전용 Bastion EC2

## Status

구현 완료. `infra/stacks/bastion-stack.ts`(신규)가 SSM 전용 EC2를 만들고,
`infra/stacks/network-stack.ts`에 인바운드 규칙이 없는 `bastion-sg`를 추가해 `rds-sg`
인그레스의 두 번째 소스로 등록했다. `infra/scripts/db-tunnel.sh`(`npm run db:tunnel`)와
`infra/scripts/db-credentials.sh`(`npm run db:credentials`)로 pgAdmin4 등 로컬 클라이언트가
RDS(`publiclyAccessible: false`, 여전히 인터넷 비노출)에 접근한다.

---

## Context

RDS를 pgAdmin4 같은 로컬 GUI 클라이언트로 확인해야 하는 상황이 반복적으로 생긴다(스키마 확인,
데이터 점검, 마이그레이션 결과 검증 등). 그런데 `database-stack.ts`의 RDS는 처음부터
`publiclyAccessible: false`이고, `network-stack.ts`의 `rds-sg`는 ECS 태스크 보안그룹에서 오는
5432만 허용한다 — 로컬 PC는 애초에 접근 경로가 없다.

---

## Problem

로컬에서 private RDS에 접근하는 방법을 세 가지 후보로 검토했다.

1. **RDS를 임시로 `publiclyAccessible: true` + SG에 내 IP `/32` 허용**
2. **AWS Client VPN Endpoint** (mutual TLS)
3. **SSM Session Manager 포트포워딩용 Bastion EC2**

세 방식 모두 비용/DX/협업 확장성 기준으로 트레이드오프가 있었다.

### 방식 1 (IP 화이트리스트)의 한계

비용은 완전히 $0이다(`publiclyAccessible`도 SG ingress 추가도 그 자체로 과금되는 리소스가
아니다). 하지만:

- **협업에 근본적으로 안 맞는다.** 팀원마다 IP가 다르고, 특히 가정용 회선은 유동 IP라 수시로
  바뀐다 — 사람이 늘거나 IP가 바뀔 때마다 SG를 계속 고쳐야 한다.
- **감사 로그가 없다.** SG는 "이 IP는 통과"만 판단할 뿐, 누가 언제 접속했는지 기록하지 않는다.
- **RDS가 상시로 인터넷에 노출되는 공격 표면을 만든다.** SG를 특정 IP로 좁혀도, 인스턴스
  자체가 퍼블릭 IP/DNS를 항상 가지는 상태가 된다. 나중에 SG를 잘못 건드리면(`0.0.0.0/0` 실수
  추가 등) 그 순간 바로 전 세계에 노출된다.
- 이 프로젝트가 지금까지 지켜온 보안 가드레일(NAT 없이도 인바운드는 SG로 철저히 제한,
  `020-cloudfront-https.md`의 CloudFront-only ALB 접근 등)과 서사적으로 배치된다 — 포트폴리오
  코드 리뷰 관점에서 바로 지적받을 지점이다.

### 방식 2 (Client VPN)의 한계

IAM으로 접근을 통제할 수 있어 협업에는 적합하지만, **과금 구조가 이 프로젝트 규모에 안 맞는다.**
Association(서브넷 연결) 자체가 시간당(~$0.10/h) 과금되며, **연결을 한 번도 안 해도 association이
걸려 있는 한 계속 청구된다.** 한 달 내내 배포 상태로 두면 association만으로 월 $72+가 나온다 —
NAT Gateway(월 $30+, 이 프로젝트가 처음부터 회피해온 비용)보다도 비싸다. 매번 `cdktf
deploy`/`destroy`로 껐다 켜서 과금을 피하는 방법도 있지만, Terraform apply 왕복 자체가 느려서
"DB 한 번 보려고 몇 분씩 기다리는" DX 문제가 그대로 남는다.

---

## Decision

**SSM Session Manager 전용 Bastion EC2**를 도입한다.

- `network-stack.ts`에 `bastion-sg`를 추가한다. **인바운드 규칙이 하나도 없다** — SSM
  에이전트는 AWS SSM 서비스로 아웃바운드 HTTPS(443) long-polling만 하므로 인바운드 포트 자체가
  필요 없다. `rds-sg` 인그레스에는 기존 `ecs-task-sg` 규칙에 더해 `bastion-sg`를 소스로 하는
  5432 규칙을 하나 더 추가한다(제자리 업데이트, 재생성 없음 — 아래 Reason 참고).
- `bastion-stack.ts`(신규, network-stack만 참조하는 독립 스택)가 `t4g.micro` EC2 하나를
  public 서브넷에 만든다. NAT 없이 아웃바운드가 되도록 퍼블릭 IP를 직접 받는다(ECS Fargate
  태스크와 동일한 원칙, `019-ecs-fargate-migration.md`). AMI는 SSM Public Parameter
  (`/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64`)로 배포 시점에
  동적 조회한다.
- IAM Role에 AWS 관리형 정책 `AmazonSSMManagedInstanceCore`만 붙인다.
- `scripts/db-tunnel.sh`(`npm run db:tunnel`)가 인스턴스를 start → SSM 온라인 등록 대기 →
  `aws ssm start-session --document-name AWS-StartPortForwardingSessionToRemoteHost`로
  `localhost:15432` ↔ RDS `5432`를 연결한다. **Ctrl+C로 세션을 끊으면 EXIT trap이 인스턴스를
  자동으로 stop한다.**
- `scripts/db-credentials.sh`(`npm run db:credentials`)가 `database-stack`의 output(시크릿
  ARN)으로 Secrets Manager에서 마스터 비밀번호를 조회해 pgAdmin4 접속 정보를 출력하고,
  비밀번호는 클립보드로 복사한다(터미널 히스토리에 평문으로 안 남게).
- 배포는 `cdktf deploy petlog-bastion-{env}` 한 번만 하면 되고(`deploy:all`/`diff:all`에도
  포함), 이후 실사용 시점의 켜고 끄기는 Terraform이 아니라 `db-tunnel.sh`의 EC2 start/stop이
  담당한다.

---

## Reason

### 비용 모델: "배포는 한 번, 평소엔 정지"

Client VPN과 결정적으로 다른 지점이다. EC2는 **정지 상태에서 컴퓨트 요금이 전혀 없고** EBS
볼륨(8GB gp3) 비용만 남는다(월 몇백 원 수준). `db-tunnel.sh`로 쓸 때만 켜고 끝나면 자동으로
꺼지므로, "association이 걸려 있는 한 계속 과금"되는 Client VPN의 구조적 문제가 없다.
`cdktf deploy`를 재실행해도 Terraform이 실행 중/정지 중인 인스턴스의 전원 상태를 강제로
바꾸지 않으므로, 스택 재배포와 인스턴스의 실행/정지는 서로 독립적이다.

### 협업 확장성: IP가 아니라 IAM으로 통제

새 팀원이 생기면 SG를 고칠 필요가 없다 — 그 사람의 IAM 사용자/역할에
`ssm:StartSession`(`bastion_instance_id` 리소스로 범위 제한 가능) 권한만 부여하면 끝난다.
네트워크 위치(재택/카페/사무실, IP 변경 여부)와 완전히 무관하다. 게다가 SSM 세션은
CloudTrail에 "누가 언제 세션을 열었는지" 감사 로그가 남는다 — IP 화이트리스트로는 얻을 수
없는 속성이다.

### RDS는 여전히 인터넷에 전혀 노출되지 않는다

`publiclyAccessible: false`를 유지한 채로 접근 문제를 해결한다. Bastion의 `bastion-sg`
자체도 인바운드가 없어 인터넷에서 이 인스턴스로 직접 들어올 방법이 없다 — SSM이 아웃바운드로만
동작하는 프로토콜이라는 특성을 그대로 활용한 결과다.

### SG ingress 추가가 안전한 이유

`network-stack.ts`의 `rds-sg`/`alb-sg` 정의에 이미 확립된 원칙을 그대로 따른다 — AWS
SecurityGroup의 **최상위 `description` 필드만 ForceNew(불변)**이고, `ingress` 블록(규칙
목록) 자체는 제자리 업데이트다. `bastion-sg`를 소스로 하는 규칙을 하나 추가하는 것은 SG
재생성을 유발하지 않는다(이미 RDS ENI에 붙어있는 리소스라 재생성 시도는
`DependencyViolation`으로 실패할 위험이 있었다 — 그래서 애초에 이 방식을 골랐다).

### `t4g.nano`가 아니라 `t4g.micro`를 쓰는 이유

최초 구현은 `t4g.nano`로 시도했으나, 이 AWS 계정이 Free Tier 대상 인스턴스 타입만 허용하도록
제한되어 있어 `RunInstances`가 `InvalidParameterCombination: The specified instance type is
not eligible for Free Tier`로 거부됐다. `aws ec2 describe-instance-types --filters
Name=free-tier-eligible,Values=true`로 확인한 결과, t4g 계열은 `.nano`가 아니라 `.micro`
사이즈만 Free Tier 대상이었다. 어차피 평소엔 정지 상태라 `.nano`→`.micro` 차이가 비용에 미치는
영향은 미미하다.

---

## Trade-off

### 로컬에 Session Manager 플러그인 설치가 필요하다

`aws ssm start-session`이 동작하려면 AWS CLI만으로는 부족하고, 별도 플러그인
(`session-manager-plugin`)을 로컬에 설치해야 한다(macOS는 `brew install --cask
session-manager-plugin`, Windows는 AWS 공식 `.exe` 인스톨러). 새로 합류하는 사람마다 이
설치 단계가 하나 더 추가된다.

### `db-tunnel.sh`/`db-credentials.sh`는 bash 스크립트라 Windows에서 그대로 안 돌아간다

Git Bash나 WSL로 실행하거나, 필요해지면 PowerShell(`.ps1`) 버전을 별도로 만들어야 한다.
지금은 실제 Windows 팀원이 없어 범위 밖으로 미뤘다.

### Bastion을 안 쓰는 동안에도 EC2/EIP 등 최소 리소스는 존재한다

정지 상태라도 인스턴스/EBS 볼륨 자체는 "존재"한다 — 완전히 $0은 아니고 월 몇백 원 수준의
스토리지 비용은 남는다. Client VPN의 시간당 association 과금보다는 훨씬 저렴하지만, 인프라를
아예 destroy하는 것보다는 비싸다. "완전히 안 쓸 계획이면 `cdktf destroy
petlog-bastion-{env}`로 스택 자체를 지운다"는 선택지도 있다.

### `bastion-sg` 아웃바운드가 전체 허용(0.0.0.0/0)이다

SSM(443)과 RDS(5432)만 필요하지만, `ecs-task-sg`와 동일한 이유로 범위를 좁히지 않고
단순화했다 — 인바운드가 이미 전혀 없어 아웃바운드 전체 허용이 실제 보안 경계를 약화시키지
않는다고 판단했다. 다만 인스턴스가 침해되는 경우를 극단적으로 가정하면, 아웃바운드를 SSM
엔드포인트 대역 + RDS 5432로 더 좁히는 방향도 향후 검토 가능하다.

---

## 관련 문서

- `infra/README.md`의 "현재 스택 목록" — `bastion-stack` 항목.
- `infra/stacks/network-stack.ts` — `bastion-sg`/`rds-sg` 정의, SecurityGroup
  description 불변성에 대한 기존 주석.
- `019-ecs-fargate-migration.md` — NAT 없이 public 서브넷 + 퍼블릭 IP로 아웃바운드를
  확보하는 동일한 원칙의 원본 결정.
- `020-cloudfront-https.md` — 이 프로젝트가 지켜온 "인바운드는 항상 최소한으로" 원칙의
  또 다른 사례.
