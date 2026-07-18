# Decision: 리포트 공유 기능 — 공개 조회만 REST, 나머지는 GraphQL

## Status

결정됨 (2026-07-18)

---

## Context

신규 사용자 유치를 위해 "리포트 공유" 기능을 추가한다(기획 배경은
product-planner/ui-designer 산출물, 데이터 모델은 아래 "스키마 결정" 참고).
회원이 완료된 AI 리포트를 SNS 이미지 카드 또는 외부 링크로 공유하면,
비회원도 `/share/reports/:shareToken`으로 로그인 없이 열람할 수 있고,
하단 CTA로 회원가입을 유도한다.

`008-graphql-prisma.md`에서 이미 "도메인 API는 GraphQL, 프레임워크 제약이
있을 때만(쿠키 처리 — auth, multipart — upload) REST로 예외"라는 원칙을
정했다. 이번 기능이 그 원칙에 세 번째 예외를 추가할 만한지가 이번 결정이다.

---

## Problem

리포트 공유 기능은 두 그룹의 API로 나뉜다.

1. **소유자용** (로그인 필요): 공유 시작/재공유, 공유 중지, concerns 포함
   토글, 현재 공유 설정 조회 — 4개 오퍼레이션
2. **공개용** (로그인 불필요): 토큰으로 리포트 조회 — 1개 오퍼레이션

이 중 공개용 조회를 GraphQL로 만들지 REST로 만들지가 문제였다.

---

## Decision

**소유자용 4개는 GraphQL**(`ReportShareResolver`, 기존 `ReportResolver`와
동일 패턴, `GqlAuthGuard`)로, **공개 조회 1개만 REST**(`GET
/api/report-shares/:token`, `ReportSharePublicController`)로 분리한다.

---

## Reason

### 1. Rate limiting이 이 코드베이스에 REST 전용으로만 존재한다

`@nestjs/throttler`의 `ThrottlerGuard`/`@Throttle`은 지금까지
`auth.controller.ts`(회원가입/로그인/비밀번호 찾기)에서만 쓰였고, 전부
REST 엔드포인트다. GraphQL 리졸버에 동일한 rate limit을 걸려면 커스텀
Guard(GraphQL 컨텍스트에서 IP/요청을 추출하는 어댑터)를 새로 만들어야
했다. 토큰 무차별 대입 방어라는, 로그인 시도 방어와 정확히 같은 위협
모델을 가진 엔드포인트에 새 인프라를 만들기보다 기존 걸 그대로 재사용하는
쪽을 택했다.

### 2. REST는 "필드 자체가 없음"을 자연스럽게 표현한다

공유 설정에서 `includeConcerns`가 false면, 공개 응답에 `concerns` 필드가
**아예 없어야** 한다(프론트가 "빈 배열이라 안 보여준다"가 아니라 "애초에
없다"로 처리하게 하기 위함 — `.claude/docs/decisions`의 다른 문서들에서
반복된 "빈 상태 문구조차 노출하지 않는다"는 원칙과 동일). REST/JSON
응답은 키를 조건부로 아예 생략할 수 있지만, GraphQL은 스키마에 정의된
필드가 응답에 `null`로라도 나타나는 게 기본이라 "필드가 존재하지 않음"을
표현하려면 별도 처리가 더 필요했다.

### 3. 그 외 API는 계속 GraphQL — 예외를 확대하지 않는다

소유자용 4개 오퍼레이션은 위 두 가지 제약(rate limit, 필드 생략)이
해당되지 않는다(로그인된 사용자, 항상 자기 설정을 온전히 봄). 굳이 REST로
옮길 이유가 없어 기존 `ReportResolver`와 동일한 패턴을 그대로 따랐다.
"프레임워크 제약이 있을 때만 예외"라는 `008` 원칙을 공개 조회 1개로만
좁게 적용했다.

---

## 스키마 결정 (db-designer 산출물)

```prisma
model ReportShare {
  id              String   @id @default(uuid())
  reportId        String   @unique @map("report_id")
  shareToken      String   @unique @map("share_token")
  isActive        Boolean  @default(true) @map("is_active")
  includeConcerns Boolean  @default(false) @map("include_concerns")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@map("report_shares")
}
```

`Report`에 컬럼을 얹지 않고 별도 테이블로 분리했다 — `RefreshToken`/
`PasswordResetToken`(토큰은 항상 별도 테이블)과 `NotificationPreference`
(1:1 부가 설정도 별도 테이블, 행이 없으면 기본값)라는 이 코드베이스의
두 기존 컨벤션의 교집합이기 때문이다.

**`shareToken`은 해시하지 않고 원문 저장한다** — 기존 토큰 컨벤션에서
의도적으로 이탈한 지점이다. `RefreshToken`/`PasswordResetToken`은 발급
후 다시 보여줄 필요가 없는 1회성 자격 증명이라 해시만 저장해도 되지만,
`shareToken`은 재공유 시 토큰을 재발급하지 않고 소유자에게 동일한 공유
URL을 다시 보여줘야 한다. 단방향 해시로는 원문 복원이 불가능하므로
`randomBytes(32).toString('hex')`(`PasswordResetToken`과 동일한 생성
방식)로 추측 불가능성만 확보하고 원문을 저장한다 — capability URL이지
계정 자격 증명이 아니므로 위협 모델이 다르다는 판단이다.

`isActive=false`(공유 중지됨)와 "공유한 적 없음"(행 없음)은 공개 조회
응답에서 절대 구분하지 않는다 — `PasswordResetToken`의 enumeration 방지
원칙과 동일하다.

---

## Trade-off

- REST/GraphQL이 한 도메인(`report/`) 안에 공존하게 됐다. `report.module.ts`
  하나에 `controllers`와 `providers`(리졸버)가 같이 등록되는 형태라, 새로
  합류하는 사람이 "왜 이것만 REST인지" 바로 알기 어려울 수 있다 — 이 문서와
  `report-share-public.controller.ts`/`report-share.resolver.ts`의 코드
  주석으로 근거를 남겨 대비한다.
- `ThrottlerModule.forRoot(...)`를 `AuthModule`과 `ReportModule`에 각각
  독립적으로 등록했다. 지금은 두 곳뿐이라 문제없지만, rate limit이 필요한
  도메인이 더 늘어나면 공용 모듈로 추출할 시점을 재검토해야 한다.
