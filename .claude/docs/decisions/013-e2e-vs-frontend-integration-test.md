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
