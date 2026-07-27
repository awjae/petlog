# Decision: 프론트엔드 상태 관리 전략 (UI State / 전역 상태)

## Status

결정됨. **UI State와 전역 상태 범위만 유효하다.**

Server State 결정은 `012-apollo-client-over-tanstack-query.md`로 대체됨 (2026-06-25).

갱신 이력:
- 2026-07-27 — 문서 범위를 UI State / 전역 상태로 축소. Decision만 바뀌고 남아 있던
  TanStack Query 근거(Reason·Trade-off)를 제거하고 012로 넘겼다

---

## Context

Next.js + React 기반 프론트엔드에서 상태를 어떻게 관리할 것인가.

상태는 크게 두 종류다:

- Server State: API에서 가져오는 데이터 (Pet, HealthRecord 등) → **`012` 참고**
- UI State: 모달 열림/닫힘, 폼 입력 값 등 → 이 문서

---

## Problem

상태 관리 라이브러리를 어떻게 구성할 것인가?

가능한 방향:

1. Redux 단일 스토어로 모든 상태 관리
2. Zustand로 전역 상태 관리
3. Server State는 전용 라이브러리, UI State는 React 기본 상태

---

## Decision

- **Server State**: `012-apollo-client-over-tanstack-query.md`로 분리
- **UI State**: React useState / useReducer
- **전역 상태**: 최소화. 필요한 경우에만 Zustand 도입

---

## Reason

### UI State는 지역 상태

모달, 폼, 토글은 해당 컴포넌트 범위 내 상태다.

전역으로 끌어올릴 필요가 없다.

### 전역 상태 최소화

전역 상태가 많아지면 렌더링 추적이 어려워진다.

인증 정보처럼 앱 전체에서 필요한 상태만 전역으로 관리한다.

Server State를 전용 라이브러리가 캐시하므로, 전역 스토어가 API 데이터를 들고 있을 이유도
없다. Redux 단일 스토어를 택하지 않은 이유가 여기에 있다.

---

## Trade-off

전역 상태를 최소화하면, 어떤 상태가 전역으로 올라가야 하는지 매번 판단해야 한다.
"일단 전역"이 없으므로 경계에 있는 상태에서 결정 비용이 생긴다.

실제로 이 판단이 한 번 뒤집혔다. 선택된 반려동물(`selectedPet`)은 "화면 진입 시 초기값만
정하면 된다"고 보고 `localStorage` 유틸로 시작했으나(`016`), 사용처가 6곳으로 늘면서
각 호출부가 `get`/`set`을 스스로 챙겨야 하는 구조가 정합성 버그를 냈고 Zustand로 옮겼다
(`028-selected-pet-zustand-migration.md`).

기준을 하나 남겨 둔다. **여러 화면이 같은 값을 읽고, 그 값이 서버에서 오지 않으면**
전역으로 올린다. 서버에서 오는 값은 Apollo 캐시가 이미 전역이므로 스토어에 넣지 않는다.
