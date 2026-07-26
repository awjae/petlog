# Decision: 마지막으로 선택한 반려동물 — localStorage 영속화

## Status

`028-selected-pet-zustand-migration.md`로 대체됨 (2026-07-26). 사용처가
늘어나며 "여러 화면이 값을 공유"해야 한다는 요구가 실제로 있었고,
localStorage 유틸의 재구현 방식이 그 계약을 강제하지 못해 정합성 버그
3건으로 이어졌다. 아래 원문은 당시 판단 기록으로 남긴다.

결정됨 (`3f48368`, `96c094e` selected pet local storage 처리)

---

## Context

한 사용자가 여러 반려동물을 등록할 수 있다 (`User 1:N Pet`). 홈/리포트 화면은 "현재 선택된 반려동물" 기준으로 데이터를 보여준다.

`007-frontend-state-management.md`는 "전역 상태는 정말 필요한 경우에만, 남용 금지"를 원칙으로 세웠다. "선택된 반려동물"이 그 "필요한 경우"에 해당하는지, 해당한다면 어떤 방식으로 유지할지 결정이 필요했다.

---

## Problem

새로고침하거나 다른 화면(홈 ↔ 리포트)을 오갈 때마다 첫 번째 반려동물로 초기화되면, 반려동물이 여러 마리인 사용자는 매번 다시 선택해야 한다.

가능한 방향:

1. React state로만 관리 — 새로고침/화면 이동 시 초기화됨
2. Zustand 등 전역 상태 스토어 도입
3. 서버에 "마지막 선택 반려동물"을 저장 (User 테이블에 컬럼 추가)
4. `localStorage`에 `petId`만 저장하고, 각 화면에서 초기값으로 사용

---

## Decision

`frontend/src/features/shared/utils/lastSelectedPet.ts`에 `localStorage` 기반 유틸(`getLastSelectedPetId` / `setLastSelectedPetId` / `removeLastSelectedPetId`)을 만들고, 홈/리포트 화면에서 선택 상태의 초기값이자 변경 시 동기화 대상으로 사용한다.

Zustand나 서버 저장은 도입하지 않는다.

---

## Reason

### 서버 상태가 아니라 디바이스 로컬 UX 상태

"마지막으로 본 반려동물"은 다른 기기와 동기화될 필요가 없는, 이 브라우저에서의 UX 편의 상태다. `007`이 정의한 Server State(API 데이터)도 아니고 컴포넌트 지역 UI State도 아닌, 그 중간의 "디바이스 로컬 영속 상태"다. 서버 컬럼으로 만들면 단순 UX 편의를 위해 API 호출과 DB 스키마 변경이 필요해져 과설계가 된다.

### 전역 상태 스토어 없이도 충분

여러 컴포넌트가 실시간으로 구독할 필요 없이, 화면 진입 시 "초기값을 무엇으로 할지"만 결정하면 되는 문제다. Zustand 같은 반응형 전역 스토어를 도입하면 `007`의 "전역 상태 남용 금지" 원칙과 충돌한다. `localStorage` 읽기/쓰기 함수만으로 충분하다.

### SSR 안전성과 접근 실패 대비

`typeof window === 'undefined'` 체크로 Next.js 서버 사이드 렌더링 중 호출돼도 안전하게 `null`을 반환한다. `try/catch`로 시크릿 모드 등 `localStorage` 접근이 차단된 환경에서도 앱이 죽지 않고 조용히 무시하도록 했다 — 이 상태는 없어도 기능이 동작하는 "있으면 좋은" 편의 기능이지 필수 상태가 아니기 때문이다.

---

## Trade-off

- 다른 기기에서는 마지막 선택이 유지되지 않는다 (의도된 제약 — Context 참고).
- 반려동물이 삭제되면 `localStorage`에 남은 `petId`가 더 이상 유효하지 않을 수 있다. 각 사용처에서 `pets.find(p => p.id === selectedPetId) ?? pets[0]` 형태로 폴백 처리가 필요하며, 이 폴백 로직이 유틸 함수가 아닌 각 화면(`PetSelector` 등)에 개별적으로 존재한다.
- 로그아웃 시에도 `removeLastSelectedPetId()`를 호출한다 (`settings/page.tsx`의 `handleLogout`). 위 폴백 덕분에 다른 사용자의 `petId`가 남아있어도 데이터가 섞이진 않지만(새 계정의 pet 목록과 매치되지 않아 즉시 `pets[0]`로 대체됨), 같은 기기를 여러 계정이 공유하는 상황(가족 공유 등)에서 불필요한 상태가 남지 않도록 로그아웃을 "세션 종료" 시점으로 명확히 하기 위함이다.
