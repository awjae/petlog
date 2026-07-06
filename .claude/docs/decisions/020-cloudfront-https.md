# Decision: 공유 ALB HTTPS 지원 — CloudFront 기본 도메인 + 캐싱 비활성화

## Status

구현 완료. `backend-stack.ts`에 `CloudfrontDistribution`을 추가했고, `network-stack.ts`의
`alb-sg` 인그레스를 `0.0.0.0/0`에서 CloudFront 오리진 전용 관리형 프리픽스 리스트
(`com.amazonaws.global.cloudfront.origin-facing`)로 좁혔다. `FRONTEND_URL`/
`NEXT_PUBLIC_API_URL`은 더 이상 ALB URL이 아니라 이 CloudFront 배포의 기본 도메인
(`cloudfront_url` output)을 참조한다.

---

## Context

`019-ecs-fargate-migration.md`에서 backend/frontend가 공유하는 ALB(`backend-stack.ts`)를
도입했지만, 그 ALB 리스너는 포트 80(HTTP)만 열었다 — 커스텀 도메인/ACM 인증서가 없다는 이유로
HTTPS를 범위 밖으로 미뤄뒀다(`infra/README.md`의 "아키텍처 결정 요약" 참고).

그 결과 로그인 시 발급되는 JWT/Refresh Token, 건강 기록 같은 개인정보가 전부 평문 HTTP로
오간다. 이 문제를 해결해야 한다.

---

## Problem

ALB에 HTTPS를 붙이려면 통상 다음이 필요하다.

1. 커스텀 도메인 구매 (Route53 hosted zone 또는 외부 등록기관)
2. 그 도메인에 대한 ACM 인증서 발급 + 도메인 소유권 검증(DNS 검증 레코드 등록)
3. ALB 리스너에 그 인증서를 붙인 HTTPS(443) 리스너 추가

그런데 ALB 자체의 기본 도메인(`*.elb.amazonaws.com`)에는 ACM 인증서를 발급받을 수 없다 — AWS가
자신이 소유한 도메인에 대해 타 계정에 인증서를 내주지 않기 때문이다. 즉 커스텀 도메인 없이는
ALB에 직접 HTTPS를 붙일 방법이 없다.

이 프로젝트는 개인 포트폴리오 규모이고, 아직 실제 서비스 도메인을 확정하지 않았다. 도메인
구매 비용과 Route53/ACM 운영 부담을 지금 시점에 지는 것이 맞는지 검토가 필요했다.

---

## Decision

**커스텀 도메인을 사지 않고, ALB 앞단에 CloudFront를 추가해 CloudFront의 기본
`*.cloudfront.net` 도메인에 자동으로 발급되는 무료 TLS 인증서로 HTTPS를 종단한다.**

- CloudFront 배포(`backend-stack.ts`가 소유)의 오리진은 공유 ALB(`CustomOriginConfig`,
  `originProtocolPolicy: 'http-only'`, 포트 80). ALB에는 여전히 HTTPS 리스너를 추가하지 않는다.
- 뷰어 프로토콜 정책은 `redirect-to-https` — HTTP로 들어와도 강제로 HTTPS로 리다이렉트한다.
- 캐시 정책은 AWS 관리형 `CachingDisabled`(ID 고정값)를 사용해 **캐싱을 사실상 끈다.**
- 오리진 요청 정책은 AWS 관리형 `Managed-AllViewerExceptHostHeader`(ID 고정값)를 사용해
  쿠키/헤더/쿼리스트링을 전부 오리진(ALB)까지 그대로 전달한다.
- 허용 메서드는 `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE` 전부.
- `priceClass: 'PriceClass_100'`, 커스텀 도메인/ACM 인증서 없음(`cloudfrontDefaultCertificate:
  true`) — `storage-stack.ts`의 이미지 CloudFront와 동일한 비용/도메인 원칙을 재사용한다.
- `network-stack.ts`의 `alb-sg` 인그레스 80을 `0.0.0.0/0`에서 AWS 관리형 프리픽스 리스트
  `com.amazonaws.global.cloudfront.origin-facing`(CloudFront 엣지에서 나가는 트래픽의 IP
  대역)으로 좁힌다 — `prefixListIds` 필드를 쓰고, `cidrBlocks`는 더 이상 쓰지 않는다.

---

## Reason

### storage-stack의 검증된 패턴을 재사용

`storage-stack.ts`가 이미지 서빙을 위해 CloudFront 기본 도메인 + 무료 인증서 패턴을 쓰고
있었고, 배포/운영 경험이 있는 패턴이다. 커스텀 도메인을 사는 대신 이 패턴을 ALB에도 적용하면
Route53/ACM 없이 HTTPS를 얻을 수 있다 — 개인 프로젝트 단계에서 도메인 구매/DNS 검증이라는
추가 의존성과 운영 부담을 지지 않아도 된다.

### 이미지 CloudFront와 캐시 전략은 반대로 간다

`storage-stack.ts`의 CloudFront는 정적 이미지가 대상이라 `CachingOptimized`로 최대한
캐시하는 것이 맞다. 반면 이번 CloudFront는 로그인 세션이 있는 동적 API 서버 + Next.js 앱
앞에 있다 — 같은 경로라도 사용자마다(또는 인증 여부에 따라) 다른 응답이 나와야 하므로,
관리형 캐시 정책 중 명시적으로 캐싱을 끄는 `CachingDisabled`를 선택했다. 직접 TTL 0을 설정하는
커스텀 캐시 정책도 대안이었지만, "캐시하지 않는다"는 의도를 정책 이름 자체로 드러내는 관리형
정책 쪽이 리뷰어(면접관 포함)가 코드만 보고도 의도를 파악하기 쉽다고 판단했다.

같은 이유로 오리진 요청 정책도 이미지 배포와 다르게 골랐다. 로그인 쿠키, GraphQL 쿼리
파라미터가 전부 백엔드까지 도달해야 하므로 `Managed-AllViewerExceptHostHeader`로 쿠키/헤더/
쿼리스트링 전체를 통과시킨다. Host 헤더만 제외한 이유는, CloudFront 도메인을 그대로 오리진에
전달하면 ALB가 리스너 규칙을 평가할 때(또는 백엔드가 `Host` 기반 로직을 쓸 경우) 예상과 다른
값을 받을 수 있어서다 — ALB 자신의 DNS 이름을 Host로 받는 편이 기존 동작과 일관된다.

허용 메서드도 이미지 CloudFront(`GET, HEAD`만)와 다르게 쓰기 메서드까지 전부 열었다 — 이
CloudFront 뒤에는 정적 파일이 아니라 로그인/기록 작성 같은 쓰기 API가 있기 때문이다.

### ALB를 CloudFront 전용으로 좁힌 이유

CloudFront로 HTTPS를 강제해도, ALB의 인그레스가 여전히 `0.0.0.0/0`으로 열려 있으면 사용자가
CloudFront를 완전히 우회해 `http://<alb-dns-name>`으로 직접 접속할 수 있다 — HTTPS를 추가한
의미가 없어진다. AWS가 공식으로 관리하는 프리픽스 리스트(`com.amazonaws.global.cloudfront.
origin-facing`)로 소스를 좁히면, ALB가 실제로 CloudFront 엣지에서 나가는 트래픽만 받고 그 외
직접 접근은 전부 거부한다. 이 리스트는 AWS가 자동으로 최신 IP 대역을 유지해주므로, CloudFront
엣지 IP가 바뀌어도 이 프로젝트가 직접 갱신할 필요가 없다.

### 다른 대안을 검토했지만 기각

- **Route53 + 커스텀 도메인 + ACM**: 가장 "정석"이지만, 도메인 구매 비용과 관리 부담이
  실사용자 확보 이전 단계의 우선순위(`CLAUDE.md` Decision Making Rule)보다 낮다고 판단했다.
  실제 도메인이 정해지면 이 CloudFront 배포에 `aliases`와 커스텀 ACM 인증서(us-east-1 발급
  필수)만 추가하면 되므로, 지금 구조가 나중에 이 전환을 막지 않는다.
- **ALB 자체 셀프사인 인증서**: 브라우저가 신뢰하지 않는 인증서라 프로덕션에 부적합해 처음부터
  제외했다.

---

## Trade-off

### CloudFront 배포가 하나 더 늘어남

계정 전체 CloudFront 프리티어(1TB 아웃바운드 + 1,000만 요청, 12개월)는 배포 단위가 아니라
계정 단위로 공유되므로, storage-stack의 이미지 배포와 이번 ALB 배포가 프리티어 한도를 나눠
쓴다. 캐싱을 껐으므로 이 배포는 요청마다 오리진(ALB)까지 왕복하지만, 개인 프로젝트 트래픽
규모에서는 비용 영향이 크지 않다(`infra/README.md`의 "비용 관련 참고사항" 참고).

### 짧은 지연 시간 추가

CloudFront가 모든 요청을 캐싱 없이 오리진까지 그대로 전달하므로, 요청마다 "뷰어 → CloudFront
엣지 → ALB" 한 홉이 추가된다. 정적 캐싱의 이점은 없고 TLS 종단 목적만 있는 구조라, 순수한 응답
속도만 보면 미세한 지연이 늘어난다. 로그인 토큰/건강 데이터를 평문으로 노출하지 않는 이득이 이
지연보다 훨씬 크다고 판단했다.

### CloudFront 배포 전파 지연

CloudFront 설정 변경은 전 세계 엣지에 전파되는 데 수 분이 걸릴 수 있다(ALB 리스너 규칙 변경보다
느리다). 배포 직후 즉시 새 설정이 모든 요청에 반영되지 않을 수 있다는 점을 배포 계획에 감안해야
한다.

### 배포 순서 의존성이 하나 늘어남

CloudFront 도메인이 바뀌면(배포를 삭제 후 재생성하는 경우 등) frontend Docker 이미지를 다시
빌드해야 한다(`NEXT_PUBLIC_API_URL`이 빌드 시점 고정, `019-ecs-fargate-migration.md`와 동일한
제약). 실제 반영 순서는: CloudFront 포함 backend-stack 배포 → 그 `cloudfront_url` 확인 →
frontend 이미지 재빌드(`--build-arg NEXT_PUBLIC_API_URL`) → frontend-stack 배포. backend의
`FRONTEND_URL`은 backend-stack 자신의 output을 그대로 참조하므로 별도 순서 없이 함께 반영된다.

---

## 관련 문서

- `.claude/docs/decisions/019-ecs-fargate-migration.md` — 공유 ALB를 도입한 계기(컴퓨트
  플랫폼 전환). 이 문서는 ALB 자체를 다시 논의하지 않는다.
- `infra/README.md`의 "아키텍처 결정 요약", "비용 관련 참고사항" — 최신 구조/비용 표는
  이 문서를 단일 출처로 삼는다.
- `infra/stacks/storage-stack.ts` — 이번에 재사용한 "CloudFront 기본 도메인 + 무료 인증서"
  패턴의 원본 구현.
