# Decision: 배포자 IAM 계정(`petlog`)은 CDKTF 밖에서 관리한다

## Status

구현 완료. `petlog` IAM User에 붙어있던 AWS 관리형 FullAccess 정책 10개(할당량 한도)를
커스텀 정책 하나(`petlog-deploy-access`)로 통합했다. 정책 원문은
`infra/bootstrap/petlog-deploy-policy.json`에 git으로 버전 관리하지만, 실제 IAM
생성/갱신은 AWS 콘솔에서 수동으로 한다 — CDKTF 리소스로 만들지 않는다.

---

## Context

`021-custom-domain-petlog-quest.md` 작업(SES Identity, ACM 인증서를 CDKTF로
`import`) 도중, 배포에 쓰는 IAM User `petlog`(모든 `cdktf deploy`/`diff`/`import`를
이 계정의 액세스 키로 실행한다)에 필요한 읽기 권한이 계속 부족하다는 게 드러났다 —
`ses:GetEmailIdentity`, `ses:ListTagsForResource`, `acm:ListTagsForCertificate`,
`route53:*`, `elasticloadbalancing:*`, `logs:*`, `kms:*` 순서로 하나씩 막히고 추가하기를
반복했다.

이 계정은 이미 AWS 관리형 FullAccess 정책 10개(EC2/RDS/ECS/ECR/S3/CloudFront/IAM/SSM/
SecretsManager/DynamoDB)가 붙어있었는데, 이는 **IAM User 하나에 부착 가능한 관리형 정책
개수의 기본 할당량과 정확히 같은 값**이었다. `AmazonRoute53FullAccess`를 11번째로
붙이려다 `LimitExceededException: Cannot exceed quota for PoliciesPerUser: 10`으로
막혔다.

---

## Problem

세 가지를 결정해야 했다.

1. **배포자 계정 자체를 CDKTF로 관리할 것인가** — 다른 모든 IAM(taskRole, S3 업로더
   User 등)은 CDKTF로 관리하는 게 이 프로젝트의 원칙(`CLAUDE.md`)인데, 이 계정도 예외
   없이 편입해야 하는가.
2. **관리형 정책 10개 할당량을 어떻게 해결할 것인가** — 정책을 더 붙일 수 없는 상태에서
   Route53 권한이 추가로 필요해졌다.
3. (실제로 발생) **정책을 통합하는 도중 자기 자신을 락아웃시켰다** — 새 통합 정책을
   붙이기 전에 기존 10개(그 중 `IAMFullAccess`)를 먼저 뗐더니, 그 직후의
   `AttachUserPolicy` 호출이 "그 작업을 허용할 권한이 없다"는 이유로 거부됐다. 통합
   정책은 이미 만들어져 있었지만 붙일 방법이 없는 상태가 됐고, 콘솔(별도 관리자/루트
   세션)에서 수동으로 붙여서 복구했다.

---

## Decision

### 배포자 계정 자체(User, 정책 attachment)는 CDKTF로 관리하지 않는다

`config.ts`의 `TERRAFORM_STATE_BUCKET`/`TERRAFORM_LOCK_TABLE`과 같은 카테고리의
부트스트랩 예외로 취급한다 — "CDKTF를 실행하는 자격증명 자신의 권한"은 CDKTF 밖에
남긴다. taskRole, S3 업로더 User 같은 **앱/서비스용 IAM**은 계속 CDKTF로 관리한다
(이 원칙은 바뀌지 않는다). 예외 대상은 정확히 "이 계정이 없으면 `cdktf apply` 자체를
실행할 수 없는 그 계정 하나"로 한정한다.

### 10개의 개별 FullAccess 정책을 커스텀 정책 하나로 통합한다

서비스별 관리형 FullAccess 정책을 붙이는 대신, 실제 쓰는 서비스 액션을 모은 인라인
customer-managed 정책 하나(`petlog-deploy-access`)로 교체했다 — `ec2:*`, `elasticloadbalancing:*`,
`rds:*`, `ecs:*`, `ecr:*`, `s3:*`, `cloudfront:*`, `iam:*`, `ssm:*`, `kms:*`,
`secretsmanager:*`, `dynamodb:*`, `route53:*`, `acm:*`, `ses:*`, `logs:*`를 `Resource: "*"`
로 허용하는 단일 statement. 관리형 정책 부착 개수는 10 → 1로 줄어 할당량 문제가
해소됐고, 여유(9개)도 생겼다.

### 정책 원문은 파일로만 버전 관리하고, CDKTF 리소스로 만들지 않는다

`infra/bootstrap/petlog-deploy-policy.json`에 정책 JSON을 그대로 커밋한다. 실제 IAM에
반영(정책 생성/`create-policy-version`)은 AWS 콘솔에서 사람이 직접 한다 — 이 파일은
"무엇이 적용되어 있어야 하는가"의 git 기록일 뿐, `cdktf apply`가 이 파일을 읽어 자동
적용하지 않는다.

---

## Reason

### 왜 배포자 계정 자체는 CDKTF 밖에 두는가

이 계정이 자기 자신의 권한을 스스로 `apply`로 바꾸는 구조는, 사람이 계획한 변경이 조금만
어긋나도(이번처럼 "새 정책을 붙이기 전에 기존 정책부터 뗀다"는 순서 실수) 다음 `apply`를
실행할 권한 자체를 잃는 self-lockout으로 이어진다. 이번에 이론이 아니라 실제로 이 사고를
겪었다 — 방지책을 문서로만 남기는 게 아니라 원칙 자체를 "이 계정은 CDKTF가 건드리지
않는다"로 확정하는 게 더 확실하다. 큰 조직은 별도 리뷰어 승인 + break-glass 관리자
계정으로 이 위험을 완화하며 배포자 권한도 Terraform으로 관리하지만, 개인 프로젝트에는
그런 안전장치가 없으므로 수동 부트스트랩이 더 안전하다.

### 왜 정책 JSON까지 CDKTF 리소스로 만들지 않았는가

"attach/detach 순서" 문제로 겪은 락아웃이지만, 정책 **내용**을 CDKTF가 관리해도 같은
종류의 위험이 남는다 — 예를 들어 리팩터링 도중 실수로 `iam:*` 액션 한 줄을 지우고
`apply`하면, 그 즉시 이 계정은 자기 정책을 되돌릴 권한도 잃는다. 정책 attachment든
정책 content든, "이 계정의 CDKTF 실행 권한 자체를 이 계정이 실행하는 CDKTF가 바꾼다"는
구조는 동일한 리스크 패턴이다. 파일로만 버전 관리하면 git diff로 리뷰는 가능하면서도,
실제 적용은 사람이 결과를 확인하며 콘솔에서 하므로 반영 도중 자기 권한을 잃는 경우가
없다.

### 왜 서비스별 세밀한 최소 권한이 아니라 `service:*` 단위로 통합했는가

각 관리형 FullAccess 정책(`AmazonEC2FullAccess` 등)은 해당 서비스와 연관 서비스까지
번들로 포함하는 경우가 많다(`AmazonEC2FullAccess`가 `elasticloadbalancing:*`을,
`AmazonSSMFullAccess`가 `kms:*`를 포함하는 식). 이걸 그대로 좁혀 재현하려 하면 이번처럼
"됐다 싶었는데 또 막힌다"를 여러 번 반복하게 된다(실제로 1차 통합 때 정확히 이 문제로
`cdktf diff`가 세 번 막혔다). 개인 프로젝트 배포자 계정이라는 스코프에서는, 서비스 단위
`*`로 통합해 재현 실패 위험을 없애는 쪽이 더 세밀한 액션 단위 최소 권한보다 실용적이라고
판단했다 — 대신 아래 Trade-off에 이 대가를 명시한다.

---

## Trade-off

### 최소 권한 원칙을 상당 부분 포기했다

`service:*` 단위 통합은 사실상 여러 개의 FullAccess를 하나로 압축한 것과 같다 — 실제로
배포에 필요한 세부 액션(`ecs:UpdateService`, `s3:PutObject` 등)만 남기는 세밀한
최소 권한화는 하지 않았다. 이 계정의 액세스 키가 유출되면 여전히 계정 내 이 13개
서비스 전체에 광범위한 영향을 줄 수 있다. 개인 포트폴리오 프로젝트 단계의 실용적
타협이며, 실사용자가 늘어나는 시점에는 재검토가 필요하다.

### 정책 파일과 실제 AWS 상태가 수동 동기화 대상이다

`infra/bootstrap/petlog-deploy-policy.json`을 고쳐도 AWS에 자동 반영되지 않는다 —
콘솔에서 반영을 깜빡하면 git의 "문서화된 권한"과 실제 IAM 상태가 어긋난 채로 남는다.
이 드리프트를 감지할 자동화(`cdktf diff` 같은)가 전혀 없다 — 사람이 기억해서 맞춰야
한다.

### self-lockout 복구 수단이 콘솔/루트 세션뿐이다

이 계정 하나로 IAM을 자기 관리하는 구조라, 락아웃되면 복구 경로가 "브라우저로 콘솔에
로그인해서 수동으로 고친다" 하나뿐이다. 별도 break-glass 관리자 계정이 없다 — 개인
프로젝트라 루트 계정 콘솔 접근이 항상 가능하다는 전제에 기대고 있다.

---

## 관련 문서

- `.claude/docs/decisions/021-custom-domain-petlog-quest.md` — 이 사고가 발생한
  원래 작업(SES/ACM `import`) 맥락.
- `infra/config.ts` — `TERRAFORM_STATE_BUCKET`/`TERRAFORM_LOCK_TABLE`을 같은 이유
  (닭-달걀 문제)로 CDKTF 밖에 둔 선례.
- `infra/bootstrap/petlog-deploy-policy.json` — 이 결정의 실제 산출물(정책 원문).
