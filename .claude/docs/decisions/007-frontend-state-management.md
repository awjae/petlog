# Decision: 프론트엔드 상태 관리 전략

## Context

Next.js + React 기반 프론트엔드에서 상태를 어떻게 관리할 것인가.

상태는 크게 두 종류다:

- Server State: API에서 가져오는 데이터 (Pet, HealthRecord 등)
- UI State: 모달 열림/닫힘, 폼 입력 값 등

---

## Problem

상태 관리 라이브러리를 어떻게 구성할 것인가?

가능한 방향:

1. Redux 단일 스토어로 모든 상태 관리
2. Zustand로 전역 상태 관리
3. Server State는 React Query, UI State는 React 기본 상태

---

## Decision

- **Server State**: Apollo Client v4 → `012-apollo-client-over-tanstack-query.md` 참고
- **UI State**: React useState / useReducer
- **전역 상태**: 최소화. 필요한 경우에만 Zustand 도입

---

## Reason

### TanStack Query

Server State의 특성(캐싱, 재검증, 로딩/에러 상태)을 자동으로 처리한다.

컴포넌트에서 직접 fetch를 제거하고 선언적으로 데이터를 사용한다.

### UI State는 지역 상태

모달, 폼, 토글은 해당 컴포넌트 범위 내 상태다.

전역으로 끌어올릴 필요가 없다.

### 전역 상태 최소화

전역 상태가 많아지면 렌더링 추적이 어려워진다.

인증 정보처럼 앱 전체에서 필요한 상태만 전역으로 관리한다.

---

## Trade-off

TanStack Query 학습 비용이 있다.

하지만 Server State 관리 코드가 크게 줄어들고 일관된 패턴을 유지할 수 있다.

---

## Status

Server State 결정은 `012-apollo-client-over-tanstack-query.md`로 대체됨 (2026-06-25)
