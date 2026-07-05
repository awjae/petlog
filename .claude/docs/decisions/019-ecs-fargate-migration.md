# Decision: 컴퓨트 플랫폼 — App Runner → ECS Fargate 전환

## Status

**구현 완료.** `backend-stack.ts`/`frontend-stack.ts`가 `EcsTaskDefinition`/`EcsService` +
공유 `Alb`(경로 기반 라우팅)로 전환됐다. `network-stack.ts`에 public 서브넷 2개 + Internet
Gateway + ALB/ECS 태스크 보안그룹을 추가했고, `shared/apprunner-iam.ts`는 `shared/ecs-iam.ts`로
대체됐다. 상세 아키텍처는 `infra/README.md`를 단일 출처로 삼는다(이 문서 하단 "구현 결과" 참고).

---

## Context

`001-tech-stack.md`와 `infra/README.md`는 컴퓨트 플랫폼으로 AWS App Runner를 선택했다 (개인
프로젝트 규모에서 ALB/VPC 고정비 없이 가장 단순하게 컨테이너를 운영할 수 있다는 이유,
`infra/README.md`의 "아키텍처 결정 요약" 참고). 서비스 배포 리전은 타겟 사용자(한국 반려동물
보호자)와의 레이턴시를 위해 처음부터 `ap-northeast-2`(서울)로 고정해왔다.

`018-deploy-script-consolidation.md`에서 정리한 `npm run deploy:all`로 실제 배포를 시도하는
과정에서, **App Runner가 서울 리전(`ap-northeast-2`)을 지원하지 않는다는 사실**을 확인했다.
즉 지금 코드(`backend-stack.ts`/`frontend-stack.ts`의 `ApprunnerService`)는 리전을 바꾸지
않는 한 배포 자체가 불가능하다.

---

## Problem

두 축 중 하나를 포기해야 하는 상황이다.

1. **리전을 유지하고 컴퓨트 플랫폼을 바꾼다** — `ap-northeast-2`는 그대로 두고, App Runner
   대신 이 리전에서 지원되는 컴퓨트(ECS Fargate 등)로 교체한다.
2. **컴퓨트 플랫폼을 유지하고 리전을 바꾼다** — App Runner를 그대로 쓰고, 서비스를 App Runner가
   지원하는 다른 리전(예: 도쿄 `ap-northeast-1`)에 배포한다.

---

## Decision

**리전은 서울(`ap-northeast-2`)을 유지하고, 컴퓨트 플랫폼을 App Runner에서 ECS Fargate로
전환한다.**

전환 시 바뀌는 것과 그대로 유지되는 것은 `infra/README.md`의 "ECS Fargate로 전환 시" 절에 이미
정리돼 있고, 이번 결정으로 그 절이 "가정"에서 "실행해야 할 로드맵"이 됐다. 요약하면:

- 유지: `registry-stack`(ECR), `shared/s3-access-policy.ts`(S3 권한 정의), `storage-stack`의
  환경변수 계약, `network-stack`의 private 서브넷(RDS 접근용)
- 교체: `ApprunnerService` → `EcsTaskDefinition` + `EcsService`, App Runner Access/Instance
  Role → ECS Task Execution/Task Role, 헬스체크는 ALB Target Group으로 이전
- 신규 추가: ALB가 붙을 Public 서브넷 + Internet Gateway + ALB 보안그룹 (기존 private
  서브넷만으로는 ALB를 둘 수 없음)

---

## Reason

### 초기 사용자 유치 단계에서는 리전(레이턴시)이 컴퓨트 플랫폼보다 우선한다

Petlog는 실사용자 확보가 곧 성공인 단계다(`CLAUDE.md` Project Overview). 타겟 사용자가 한국
반려동물 보호자인 이상, 서비스가 어느 리전에서 도는지는 실제 응답 속도에 직접 영향을 준다.
반면 컴퓨트 플랫폼(App Runner vs ECS Fargate)은 사용자에게 보이지 않는 내부 구현 선택지다.
"보이지 않는 것을 바꿔서 보이는 것(레이턴시)을 지킨다"는 우선순위가 명확했다.

### 전환 경로가 이미 설계돼 있었다

`infra/README.md`의 "ECS Fargate로 전환 시" 절이 이미 이번 결정 이전부터 존재했다 — 애초에
"컴퓨트는 App Runner (ECS Fargate 아님)"을 선택하면서도 "ECS Fargate로 쉽게 전환 가능하도록
레지스트리(ECR)와 IAM 권한 '정의'를 컴퓨트 플랫폼과 분리해뒀다"고 명시해뒀기 때문에, 이번 리전
제약이 드러났을 때 설계를 다시 하는 게 아니라 이미 있던 로드맵을 실행하기만 하면 된다.

### 도쿄 리전으로 옮기는 대안은 기각

리전을 도쿄(`ap-northeast-1`)로 옮기면 컴퓨트 플랫폼(App Runner)과 지금까지의 인프라 코드를
거의 그대로 유지할 수 있었지만, 한국 사용자 기준 레이턴시가 늘어나는 트레이드오프를 서비스
출시 전부터 감수하게 된다. 초기 사용자 경험(특히 모바일 우선 서비스의 응답성, `CLAUDE.md`
UX Principles)을 컴퓨트 플랫폼 선택의 편의보다 우선했다.

---

## Trade-off

### 비용 구조 상승

ALB 시간당 고정비(~$16/월)가 새로 발생한다. NAT Gateway는 Public 서브넷만 ALB용으로 쓰고 ECS
태스크 자체는 기존처럼 아웃바운드 인터넷이 불필요하면 회피할 수 있지만, ALB 자체의 고정비는
App Runner에는 없던 비용이다 (`infra/README.md`의 "비용 관련 참고사항" 절 기준 재산정 필요).

### 인터뷰 어필 관점에서는 오히려 긍정적이지만, 구현/운영 복잡도는 증가

VPC/ALB/태스크 정의를 직접 설계하는 경험 자체는 포트폴리오 관점에서 얻는 게 있지만
(`infra/README.md` 참고), App Runner 대비 관리해야 할 리소스(태스크 정의, 서비스, ALB, 타겟
그룹, 보안그룹, 오토스케일링 설정)가 늘어나 운영 부담이 커진다.

### ALB 리스너 존재 시점에 대한 암묵적 의존

`frontend-service`(ECS)가 공유 ALB의 타겟 그룹에 안전하게 등록되려면 ALB 리스너가 먼저 존재해야
하는데, CDKTF는 스택을 넘나드는 `dependsOn`으로 다른 스택의 리소스를 직접 참조하는 것을 지원하지
않는다. 그래서 이 의존성은 코드 상의 명시적 관계가 아니라 "`main.ts`가 `frontend-stack`을
`backend-stack` 다음에 생성하고, `deploy.sh`도 같은 순서로 배포한다"는 **배포 순서 관례**로만
보장된다(`backend-stack.ts`/`frontend-stack.ts`의 관련 주석 참고). 이 순서를 어기고 두 스택을
독립적으로/병렬로 배포하면 타겟 등록이 실패할 수 있다.

---

## 구현 결과 (전환 완료 후 추가)

- ALB는 backend-stack이 만들고 backend/frontend가 공유한다(서비스마다 ALB를 따로 만들지
  않아 고정비를 2배로 만들지 않는다). 리스너 규칙으로 `/api/*`는 backend 타겟 그룹, 그 외
  전부(default action)는 frontend 타겟 그룹으로 라우팅한다.
- 이 설계 덕분에 App Runner 시절 backend/frontend가 서로 다른 도메인을 가져서 필요했던
  `FRONTEND_URL` ↔ `NEXT_PUBLIC_API_URL` 순환 의존과 2단계 배포가 사라졌다 — 둘 다 공유 ALB의
  URL 하나만 참조하면 된다(`infra/README.md`의 "ALB 공유로 순환 의존이 사라진 이유" 참고).
- ALB 비용은 서울 리전 기준 시간당 약 $0.0252(월 약 $18)로, Trade-off 절에서 추정한 ~$16/월보다
  약간 높다. 실제 비용 표는 `infra/README.md`의 "비용 관련 참고사항"을 최신 출처로 삼는다.
- ECS는 App Runner의 `auto_deployments_enabled`처럼 ECR push만으로 자동 재배포되지 않아,
  `backend`/`frontend`의 `docker:deploy`에 `aws ecs update-service --force-new-deployment`
  호출을 추가했다(`docker:force-redeploy` 스크립트).

## 관련 문서

- `infra/README.md`의 "아키텍처 결정 요약" 절 — 최종 구현된 네트워크/ALB/ECS 구조
- `018-deploy-script-consolidation.md` — 이 리전 제약을 발견한 계기가 된 `deploy:all` 통합 작업
- `001-tech-stack.md` — 원래 App Runner를 선택한 배경
