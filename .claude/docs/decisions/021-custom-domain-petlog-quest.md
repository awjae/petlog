# Decision: 커스텀 도메인(petlog.quest) 연결 — DNS는 Porkbun 유지, 레코드만 CloudFront로

## Status

구현 완료. `backend-stack.ts`의 `CloudfrontDistribution`이 더 이상 기본
`*.cloudfront.net` 도메인이 아니라 `aliases: ['petlog.quest']` + `us-east-1` ACM 인증서를
쓴다. 도메인/인증서 모두 AWS 콘솔에서 먼저 수동으로 만든 뒤 `terraform import`로 CDKTF
state에 편입했다. DNS 자체(레코드)는 Porkbun에 남아있고 CDKTF가 관리하지 않는다.

---

## Context

`020-cloudfront-https.md`는 "실제 도메인이 정해지면 이 CloudFront 배포에 `aliases`와
커스텀 ACM 인증서(us-east-1 발급 필수)만 추가하면 되므로, 지금 구조가 나중에 이 전환을
막지 않는다"고 예고해뒀다. `petlog.quest`를 Porkbun에서 구매하면서 그 시점이 됐다.

다만 이번엔 순서가 거꾸로였다 — CDKTF 코드를 먼저 쓴 게 아니라, ACM 인증서 발급과
CloudFront `aliases` 설정을 콘솔에서 먼저 수동으로 끝낸 뒤에야 "이것도 CDKTF로 가져와야
하지 않을까"라는 질문에서 이 작업이 시작됐다. `cdktf diff`를 돌려보고서야 콘솔에서 만든
ACM 인증서/CloudFront alias가 코드에 없어 다음 `apply`에 `petlog.quest` alias가
제거될 뻔했다는 걸 발견했다 — 실사용 중인 도메인이 끊길 수 있는 드리프트였다.

---

## Problem

세 가지를 결정해야 했다.

1. **DNS는 어디서 관리하는가** — Porkbun(등록기관 자체 DNS)에 그대로 둘지, Route53으로
   네임서버를 이전해 레코드까지 CDKTF로 관리할지.
2. **DNS가 무엇을 가리켜야 하는가** — 도메인을 ALB에 직접 연결할지, CloudFront를 거칠지.
3. **콘솔에서 이미 만든 리소스(ACM 인증서)를 어떻게 코드로 편입하는가** — 재생성하면
   실제 인증서 ARN이 바뀌어 CloudFront 연결이 끊긴다. `import`로 기존 리소스를 그대로
   가져와야 했다.

---

## Decision

### DNS는 Porkbun에 그대로 둔다

네임서버를 Route53으로 옮기지 않는다. `petlog.quest` 도메인의 A/ALIAS 레코드는 Porkbun
DNS 관리 화면에서 직접 추가한다 (`@` → CloudFront 배포 도메인 `d2mpbbyt7vuq5r.cloudfront.net`,
레코드 타입은 apex이므로 표준 CNAME이 아니라 Porkbun의 `ALIAS` 타입 사용). 이 레코드는
CDKTF가 관리하지 않는다 — Route53 Hosted Zone이 없으므로 관리할 대상 자체가 없다.

기존에 Porkbun이 자동으로 만들어둔 `*.petlog.quest CNAME → pixie.porkbun.com`(와일드카드
파킹 페이지)은 그대로 둔다. 와일드카드는 apex(`petlog.quest` 자체)에는 매치되지 않으므로
이번에 추가하는 apex 레코드와 충돌하지 않는다.

### DNS는 ALB가 아니라 CloudFront를 가리킨다

```
브라우저 → DNS(petlog.quest, Porkbun) → CloudFront(TLS 종단) → ALB(HTTP-only, origin) → ECS
```

DNS는 CloudFront 도메인까지만 알면 된다. CloudFront→ALB 연결은 `backend-stack.ts`의
`CloudfrontDistribution.origin`(오리진) 설정이 담당하며, 이건 CDKTF 코드 안의 값이라
DNS/Porkbun과는 무관하다. `020-cloudfront-https.md`에서 이미 ALB에 HTTPS 리스너를
붙이지 않기로 했으므로(ALB 기본 도메인은 ACM 인증서 발급 대상이 아님), 커스텀 도메인이
생겨도 이 구조는 바뀌지 않는다 — 바뀌는 건 CloudFront의 `viewerCertificate`/`aliases`뿐이다.

### ACM 인증서는 `import`로 가져오고, 리소스 단위 `region` override로 관리한다

`AcmCertificate`(us-east-1 고정, CloudFront 제약)를 `backend-stack.ts`에 선언하고
`terraform import`로 이미 발급된 인증서(DNS 검증 완료, ISSUED)를 그대로 편입했다. 새
`AwsProvider` alias 블록을 추가하지 않고, AWS Provider v6가 지원하는 리소스 단위 `region`
필드로 `us-east-1`만 override했다 — 이 스택의 나머지 리소스는 계속 기본 리전
(`ap-northeast-2`)을 쓴다.

---

## Reason

### Route53로 옮기지 않은 이유

`infra/README.md`/`config.ts`가 이미 "도메인 구매/DNS 운영 부담을 지금 단계에서 지지
않는다"는 원칙(`020-cloudfront-https.md`의 대안 검토와 동일한 논리)을 세워뒀다. Route53
Hosted Zone은 월 $0.5 비용과 네임서버 전파 시간이 추가로 들고, 이 프로젝트가 지금 얻는
이득(레코드를 CDKTF로 관리)에 비해 실익이 작다. `CLAUDE.md`의 Decision Making Rule
(사용자 가치 > 유지보수성 > 기술적 흥미) 기준으로도 지금은 우선순위가 낮다. Porkbun DNS에
레코드 하나(`ALIAS @`) 추가하는 것으로 목적(HTTPS 커스텀 도메인 연결)을 완전히 달성할 수
있으므로, 이 결정을 나중으로 미룬다 — 필요해지면 네임서버만 Route53으로 바꾸고 레코드를
그대로 재현하면 된다(막는 결정이 아니다).

### DNS를 ALB가 아니라 CloudFront로 연결한 이유

`020-cloudfront-https.md`에서 이미 ALB에 HTTPS 리스너를 붙이지 않기로 했다. 도메인이
생겼다고 이 결정이 바뀔 이유가 없다 — 오히려 커스텀 도메인의 ACM 인증서를 ALB가 아니라
CloudFront에 붙이는 쪽이 기존 구조(캐시 비활성화, `Managed-AllViewerExceptHostHeader`,
CloudFront-only 인그레스)를 그대로 재사용할 수 있어 일관적이다. DNS 레코드가 ALB의
동적 DNS 이름(`*.elb.amazonaws.com`)을 직접 알아야 할 필요도 없다 — ALB DNS 이름이
바뀌어도(리소스 재생성 등) CloudFront 오리진 설정만 CDKTF가 갱신하면 되고, Porkbun의
DNS 레코드는 전혀 건드릴 필요가 없다.

### 콘솔에서 먼저 만든 뒤 `import`한 이유

ACM 인증서는 DNS 검증이 필요해서, 발급 시점에 이미 Porkbun에 검증용 CNAME을 등록해야
한다 — CDKTF가 Route53 레코드를 관리하지 않는 이상 이 검증 과정 자체를 대신해줄 수 없다.
그래서 콘솔에서 인증서를 발급/검증 완료한 뒤, 그 결과(ARN, 상태)를 CDKTF `import`로
가져오는 순서가 됐다. 재생성하지 않고 `import`한 이유는 명확하다 — 재생성하면 새 ARN이
발급되고 검증도 처음부터 다시 해야 한다.

---

## Trade-off

### DNS 레코드는 여전히 IaC 밖에 있다

`petlog.quest`의 실제 A/ALIAS 레코드는 Porkbun 콘솔에만 존재하고 git으로 추적되지 않는다.
누가 실수로 레코드를 지우거나 바꿔도 `cdktf diff`/`plan`으로는 감지되지 않는다 — CloudFront
쪽 설정(alias/인증서)만 CDKTF가 보장하고, "그 alias로 실제 요청이 도달하는가"는 CDKTF의
관측 범위 밖이다.

### ACM 인증서 갱신 시 재검증 필요

이 인증서는 AWS가 관리하는 자동 갱신(DNS 검증 방식) 대상이지만, 검증용 CNAME이 Porkbun에
있고 Route53처럼 CDKTF가 그 레코드를 자동으로 갖고 있지 않다. 갱신 검증에 실패하면(레코드가
지워졌거나 등) 콘솔에서 다시 확인/재등록해야 한다 — Route53을 썼다면 `AcmCertificateValidation`
리소스로 자동화할 수 있었던 부분이다.

### 콘솔 선(先) 생성 → CDKTF `import` 흐름에서 배포자 계정 권한 문제가 드러남

이 작업 도중 배포자 IAM 계정(`petlog`)에 없던 읽기 권한들이 순차적으로 발견되어
추가됐고, 그 과정에서 관리형 정책 부착 할당량 문제와 self-lockout 사고로 이어졌다 —
이 계정 자체를 CDKTF 밖에 두기로 한 결정과 그 이유는
`022-deploy-account-bootstrap.md`에 별도로 정리했다.

---

## 관련 문서

- `.claude/docs/decisions/020-cloudfront-https.md` — CloudFront를 ALB 앞단에 둔
  근본 결정(HTTPS 종단, 캐시 비활성화). 이 문서는 그 결정을 뒤집지 않고 커스텀 도메인만
  얹는다.
- `.claude/docs/decisions/019-ecs-fargate-migration.md` — 공유 ALB 구조의 원본.
- `.claude/docs/decisions/022-deploy-account-bootstrap.md` — 배포자 계정(`petlog`)을
  CDKTF 밖에서 관리하기로 한 결정과 self-lockout 사고 상세.
- `infra/stacks/backend-stack.ts` — `domain_name`/`mail_provider`/`mail_from_address`
  TerraformVariable, `AcmCertificate`, `Sesv2EmailIdentity` 리소스가 이 결정의 실제 구현.
