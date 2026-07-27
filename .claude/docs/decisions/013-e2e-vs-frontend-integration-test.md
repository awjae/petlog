# Decision: 테스트 전략 — E2E와 Frontend Integration 분리

## Status

결정됨 (2026-06-26)

---

## Context

Petlog MVP 완성 시점에 테스트 전략을 수립했다.

Playwright를 사용하는 것으로 방향을 잡았으나, MSW(Mock Service Worker)를 이용한 테스트를 "E2E 테스트"로 부를 수 있는가라는 질문이 생겼다.

Petlog의 인증 구조:

```
POST /api/auth/login  →  httpOnly 쿠키 발급 (access + refresh)
GraphQL /api/graphql  →  쿠키 기반 인증 확인
```

---

## Problem

MSW는 Service Worker 레벨에서 네트워크 요청을 가로챈다.
Service Worker의 응답에 담긴 `Set-Cookie` 헤더는 브라우저 보안 모델에 의해 실제 쿠키로 설정되지 않는다.

결론: **MSW로는 `httpOnly` 쿠키 기반 인증 흐름을 재현할 수 없다.**

```
MSW가 /api/auth/login을 가로채더라도
→ 브라우저가 실제 쿠키를 받지 않음
→ 이후 GraphQL 요청에 쿠키가 없음
→ 인증 실패
```

그럼에도 MSW 기반 테스트를 "E2E"로 부르면 두 가지 문제가 생긴다.

1. **테스트가 보증하지 않는 것을 보증한다고 착각한다** — 인증 흐름이 실제로 동작하는지 검증하지 못한 채 "E2E 통과"라고 믿게 된다
2. **포트폴리오에서 신뢰를 잃는다** — 테스트 개념을 혼용하면 시니어 엔지니어나 채용 담당자에게 테스트 이해도가 부족하다는 신호를 준다

---

## Decision

**E2E와 Frontend Integration을 명확히 분리한다.**

| 종류 | 정의 | 대상 |
|------|------|------|
| **E2E** | UI → 백엔드 → DB 전 구간 실제 연결 | 인증 흐름 전용 |
| **Frontend Integration** | 브라우저 내 흐름 검증, 네트워크는 MSW 모킹 | 나머지 모든 화면 흐름 |

`playwright.config.ts`에서 `projects`로 두 환경을 분리한다.

```typescript
projects: [
  {
    name: 'integration',  // MSW — PR마다 CI 실행
    grep: /@integration/,
  },
  {
    name: 'e2e',          // 실제 백엔드+DB — 배포 전에만 실행
    grep: /@e2e/,
  },
],
```

---

## Reason

### 1. httpOnly 쿠키는 MSW로 재현 불가

Petlog의 인증 핵심은 JS에서 접근 불가한 `httpOnly` 쿠키다.
이 쿠키를 실제로 브라우저에 심고, 이후 요청에 자동 첨부되는지 검증하려면 실제 HTTP 서버가 응답해야 한다.
MSW는 이 레이어를 우회하기 때문에, 인증 흐름만큼은 실제 백엔드가 필수다.

### 2. 쿠키를 얻는 순간만 실제 백엔드가 필요하다

인증 이후의 GraphQL 데이터 흐름은 MSW가 완벽하게 처리한다.

```
global-setup.ts
  → 실제 백엔드에 POST /api/auth/login
  → httpOnly 쿠키 획득
  → storageState를 e2e/.auth/user.json에 저장

모든 테스트
  → user.json의 쿠키로 Context 생성 (이미 인증된 상태)
  → NEXT_PUBLIC_USE_MOCK=true 환경에서 실행
  → GraphQL은 MSW가 처리
```

전체 테스트의 약 90%는 DB 없이 빠르게 실행된다.

### 3. 각 방식이 잡아내는 버그가 다르다

E2E만 잡을 수 있는 버그:
- 쿠키 `SameSite`, `Secure` 설정 오류
- refresh token 만료 시 자동 갱신 실패
- 백엔드 GraphQL 스키마와 프론트 쿼리 불일치

Frontend Integration만으로 충분한 검증:
- 빈 상태(반려동물 없음) UI 표시
- API 실패 시 에러 메시지
- 폼 유효성 검사
- 화면 전환, 네비게이션

### 4. 포트폴리오 관점

"E2E 테스트를 작성했습니다"보다 아래 설명이 더 설득력 있다.

> "인증 흐름은 httpOnly 쿠키 특성상 MSW로 재현이 불가해 실제 백엔드와 연결하는 E2E로 분리했고, 나머지 데이터 흐름은 MSW 기반 Frontend Integration 테스트로 빠르게 검증합니다. CI에서는 PR마다 Integration, 배포 전에만 E2E를 실행합니다."

테스트 개념과 트레이드오프를 이해하고 전략적으로 선택했다는 것을 보여준다.

---

## Why Not MSW Only

- `httpOnly` 쿠키 기반 인증을 검증할 방법이 없다
- 실제 백엔드 스키마와 MSW mock이 달라도 테스트가 통과한다 (false positive)
- "E2E 테스트"라고 부를 근거가 없다

## Why Not Full Integration Only

- 모든 테스트에 DB 상태가 필요해 속도가 느리고 불안정하다
- 빈 상태, 에러 상태를 재현하려면 DB 세팅이 필요해 작성 비용이 높다
- 1인 개발 MVP 단계에서 CI 구축 비용이 과하다

---

## Trade-off

### 수용한 비용

- **global-setup 의존성**: E2E 테스트 실행 전 실제 백엔드가 반드시 떠 있어야 한다. 배포 전 CI에서 Docker Compose로 백엔드 + DB를 함께 실행하는 설정이 필요하다
- **mock drift 위험**: MSW 핸들러가 실제 백엔드 스키마와 달라질 수 있다. 스키마 변경 시 `schema.generated.graphql`과 MSW mock data를 함께 갱신하는 프로세스가 필요하다

### 수용 이유

E2E는 인증 흐름 4개 테스트에만 적용되므로 관리 범위가 좁다.
mock drift는 graphql-codegen이 타입을 자동 생성하기 때문에 스키마 변경 시 컴파일 오류로 일부 감지된다.

---

## 적용 내용

```
frontend/e2e/
├── global-setup.ts            # 실제 백엔드 로그인 → .auth/user.json
├── fixtures/auth.ts           # authenticatedPage 픽스처
├── flows/
│   ├── auth.spec.ts           # @e2e — 실제 백엔드 연결
│   ├── home.spec.ts           # @integration — MSW
│   ├── pet.spec.ts            # @integration — MSW
│   ├── health-record.spec.ts  # @integration — MSW
│   └── report.spec.ts         # @integration — MSW
└── helpers/graphql.ts         # MSW handler override 유틸

playwright.config.ts
  projects: ['integration', 'e2e']

CI 전략:
  PR      → --project=integration (MSW, 빠름)
  배포 전  → --project=e2e (실제 백엔드+DB)
```

---

## 구현 결과 (E2E 스캐폴딩 완료 후 추가, 2026-07-14)

`auth.spec.ts` 4개 시나리오와 그 실행에 필요한 설정 파일을 위 구조 그대로 작성했다.
Frontend Integration 5개 spec은 `test.skip` 스켈레톤(시나리오 목록 + TODO)만 남기고 본문
구현은 다음 단계로 미뤘다.

### 계획과 달라진 점

- **`global-setup.ts`는 `/auth/login`이 아니라 `/auth/register`를 호출한다.** `auth.controller.ts`의
  `register`가 가입과 동시에 access/refresh 쿠키를 즉시 심어주기 때문에, 별도 로그인 호출 없이
  한 번의 요청으로 인증된 storageState를 만들 수 있다.
- **계정 전략을 "고정 테스트 계정"이 아니라 "시나리오마다 신규 가입 + 종료 후 탈퇴"로 정했다.**
  고정 계정은 (1) `010-refresh-token-security.md`의 RTR 재사용 감지 로직과 충돌할 수 있고 —
  병렬/반복 실행 시 같은 계정으로 동시에 로그인하면 서로의 refresh token을 폐기시킨다 —
  (2) 테스트가 만든 데이터가 계정에 계속 누적된다. 이메일은
  `e2e+{scenario}-{timestamp}-{random}@petlog.test` 형태로 시나리오별 유니크하게 생성하고,
  종료 시 `POST /auth/withdraw`로 정리한다. 단 로그아웃 시나리오는 로그아웃 자체가 세션을
  끊어버려 탈퇴 API를 호출할 수 없다 — 이 계정은 정리하지 못한 채 남는다(아래 미해결 이슈 참고).
- **인증 가드는 `middleware.ts`가 아니라 리액티브 구조로 실제 구현돼 있음을 코드에서 확인했다.**
  전용 라우트 가드 파일은 없고, `/home`의 GraphQL 쿼리가 `UNAUTHENTICATED`로 실패 →
  `errorLink.ts`가 `/auth/refresh`를 시도 → refresh 쿠키도 없어 401 → `window.location.href = '/login'`
  으로 강제 이동시키는 흐름이다. 즉 **GraphQL 쿼리를 쏘지 않는 페이지에는 이 가드가 적용되지
  않는다** — 이 문서가 원래 가정했던 "보호 경로 접근 시 리다이렉트"가 실제로는 "인증이 필요한
  쿼리가 실패해야만" 작동하는 조건부 보호라는 뜻이다.
- **회원가입 완료 후 이동 경로는 `/pets/new`가 아니라 `/home`이다.** 신규 계정은 pet이 0개라
  `HomeNoPetContent`가 렌더링되고, 그 안의 "반려동물 등록하기" 링크를 눌러야 `/pets/new`에
  도달한다.
- **로그아웃은 `/settings` 페이지에서 처리된다** (`POST /auth/logout` → `router.push('/login')`).

### 라이브 실행 검증 완료 (2026-07-14)

로컬에서 실제 백엔드(`npm run dev:backend`) + DB(`npm run db:up`)를 띄운 뒤
`npx playwright test --project=e2e`로 4개 시나리오 모두 통과를 확인했다. 정적 검증만으로는
잡지 못했던 문제 2개가 실제 실행에서 드러나 수정했다:

- `getByLabel('비밀번호')`가 "비밀번호"/"비밀번호 확인" 두 필드 모두에 매칭되는 strict mode
  위반 → `{ exact: true }` 추가
- 신규 계정 최초 로그인 시 `OnboardingOverlay`가 `/home`에 즉시 뜨면서 CTA 클릭을 가로막음 →
  CTA를 누르기 전에 `aria-label="온보딩 닫기"` 버튼을 먼저 클릭하도록 수정

### CI 연동 (2026-07-14)

`.github/workflows/ci.yml`에 `test-e2e` job을 추가했다. `if: github.event_name == 'push'`로
**main에 push될 때만** 실행되고 PR에서는 돌지 않는다 — 별도 배포 파이프라인이 없어 배포가
수동(`npm run deploy`)이므로, "배포 전에만 실행한다"는 원래 원칙을 실제 트리거로 옮기면
"main 머지 직후(=배포 직전)"가 가장 가까운 대리 신호이기 때문이다. PR마다 돌리면 매번 실제
Postgres+백엔드를 띄워야 해서 PR 피드백 루프가 느려지는 것도 이유다.

job 구성: `postgres:16-alpine` service container → `prisma migrate deploy` → 백엔드/프론트엔드
각각 build 후 백그라운드로 기동(watch 모드가 아니라 build+start로 실행해 배포 시 실제 돌아가는
방식에 더 가깝게 맞췄다) → curl 폴링으로 준비될 때까지 대기 → `playwright install --with-deps
chromium` → `npm run test:e2e`. 실패 시에만 `playwright-report`를 아티팩트로 업로드한다.

CI 환경변수 중 `NODE_ENV`는 `production`이 아니라 `test`로 고정했다 — `auth.controller.ts`가
`NODE_ENV==='production'`일 때만 쿠키에 `secure`를 켜는데, CI는 `http://localhost`로 접속하므로
`production`으로 두면 브라우저가 Secure 쿠키를 버려 로그인 자체가 깨진다.

Integration 프로젝트(`--project=integration`)는 아직 CI에 추가하지 않았다 — 4개 spec이 전부
`test.skip` 스켈레톤이라 지금 추가해봐도 실제로 검증하는 게 없는 "통과는 하지만 의미 없는" job이
되기 때문이다(`test-backend`의 `--passWithNoTests`와 동일한 함정). 본문을 구현한 뒤 PR 트리거로
추가한다.

### 남은 미해결 이슈

- **시드 계정 누적**: 로컬/CI에서 반복 실행할수록 `e2e+seed-*` 계정이 DB에 계속 쌓인다.
  로그아웃 시나리오의 미정리 계정과 합쳐, 언젠가 일괄 정리용 `global-teardown.ts` 또는
  주기적 cleanup 스크립트가 필요하다. CI는 매 실행마다 새 Postgres 컨테이너라 무관하지만,
  로컬 개발 DB는 계속 누적된다.
- **가드 우회 가능성**: 인증 가드가 리액티브 구조(위 "계획과 달라진 점" 참고)라, 앞으로 GraphQL
  쿼리를 아예 쏘지 않는 정적 보호 페이지가 추가되면 이 가드를 우회한다. 그 시점에는
  `middleware.ts` 도입을 재검토해야 한다.
- **lint 범위 밖**: `eslint.config.mjs`가 `src/**/*.{ts,tsx}`만 대상으로 해서 `e2e/`와
  `playwright.config.ts`는 현재 lint 대상이 아니다(CI의 `lint-frontend`도 동일).
- **Integration 4종 미구현**: `home/pet/health-record/report.spec.ts`는 시나리오 목록만 있는
  스켈레톤이다.

### 정정 (report.spec.ts 구현 중 발견, 2026-07-26)

위 "계획과 달라진 점"의 "인증 가드는 리액티브 구조로 실제 구현돼 있음"과 "남은 미해결
이슈"의 "가드 우회 가능성"은 더 이상 정확하지 않다. `report.spec.ts`의 happy path를 실제로
구현하며 `NEXT_PUBLIC_USE_MOCK=true`로 프론트를 띄워 `/reports`에 접근해보니, 클라이언트 JS가
실행되기도 전에 서버 엣지에서 307 리다이렉트가 걸렸다(`curl`로 직접 확인). 원인은
`frontend/src/proxy.ts`(Next.js 16의 `middleware.ts` 대응 파일) — 이 문서가 작성된 시점 이후
추가된 것으로 보이며, `PROTECTED_PREFIXES`(`/home`, `/pets`, `/records`, `/reports`,
`/settings`)에 대해 `request.cookies.has('access_token')`만으로 인증 여부를 판단해
리다이렉트하는 정적 라우트 가드다. 즉 "GraphQL 쿼리를 쏘지 않는 페이지는 가드를 우회한다"는
우려는 이미 해소돼 있었다 — 오히려 지금은 GraphQL과 무관하게 모든 보호 경로가 엣지에서
막힌다.

다만 이 가드는 쿠키의 "존재 여부"만 검사하고 서명/만료는 검증하지 않는다(실제 검증은 이후
GraphQL `GqlAuthGuard`가 담당). 그래서 Frontend Integration 테스트에서는 `authenticatedPage`
픽스처(실제 백엔드 필요) 없이도, `context.addCookies()`로 이름만 같은 더미
`access_token` 쿠키를 심어 이 가드만 통과시키고, 그 뒤 모든 GraphQL 요청은 그대로 MSW가
처리하게 했다(`e2e/flows/report.spec.ts`의 `beforeEach` 참고). "integration은 백엔드 없이
동작해야 한다"는 원래 원칙을 지키면서 실제 가드 구조와도 맞는 방식이다.

남은 일: `home/pet/health-record.spec.ts`를 구현할 때도 동일하게 더미 쿠키 접근이 필요하다.
가능하면 이 로직을 `e2e/fixtures/` 아래 공용 헬퍼로 뽑아 중복을 줄이는 게 좋다(현재는
report.spec.ts에만 인라인으로 구현돼 있다).

---

## 추가: 세 번째 계층 — 단위 테스트 (2026-07-26)

이 문서는 원래 두 계층(e2e / integration)만 다뤘다. 프론트엔드에 테스트 러너 자체가
없어서 CLAUDE.md의 테스트 우선순위 2번("데이터 변환 로직")이 비어 있었으므로,
`vitest`를 추가하고 범위를 명시적으로 좁힌다.

| 계층 | 러너 | 대상 | 실행 시점 |
| --- | --- | --- | --- |
| unit | vitest | 순수 함수(날짜/집계 변환)만 | PR마다 |
| integration | Playwright + MSW | 브라우저 내 흐름, 네트워크는 모킹 | PR마다 |
| e2e | Playwright + 실제 백엔드 | 쿠키 인증 전 구간 | main push |

경계 규칙:

- **jsdom도, 컴포넌트 렌더링 테스트도 넣지 않는다.** 렌더링·상호작용 검증은 이미
  Playwright가 실제 브라우저에서 하고 있고, 같은 것을 가짜 DOM에서 한 번 더 검증하면
  유지비만 늘고 신뢰도는 낮아진다. `vitest.config.ts`의 environment를 node 기본값으로
  두는 것이 이 경계의 표현이다.
- **훅은 대상이 아니다.** Apollo 캐시/네트워크에 얽힌 훅은 MSW를 띄운 integration에서
  검증한다. 훅 안에 테스트하고 싶은 계산이 있다면 그건 순수 함수로 분리하라는 신호다
  (`useHomeData` → `features/home/utils/homeDerive.ts`가 그 사례).
- **시간에 의존하는 함수는 기준 시각을 인자로 받는다.** 내부에서 `Date.now()`를 부르면
  경계 케이스를 테스트할 수 없다. 실행은 `TZ=Asia/Seoul`로 고정한다 — 이 로직들의
  본질이 "UTC 문자열을 로컬 날짜로 접는 것"이라 타임존이 흔들리면 검증이 무의미해진다.
