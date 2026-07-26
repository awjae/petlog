# Decision: 선택된 반려동물 상태 — localStorage 유틸에서 Zustand 스토어로 전환

## Status

결정됨 (2026-07-26). `016-selected-pet-local-persistence.md`를 대체함.

---

## Context

`016`은 "선택된 반려동물"을 `features/shared/utils/lastSelectedPet.ts`의
`localStorage` 유틸(`getLastSelectedPetId` / `setLastSelectedPetId` /
`removeLastSelectedPetId`)로 관리하기로 했다. 근거는 "여러 컴포넌트가
실시간으로 구독할 필요 없이, 화면 진입 시 초기값만 정하면 되는 문제"라 Zustand
같은 반응형 전역 스토어는 과하다는 판단이었다.

이후 이 유틸을 사용하는 지점이 home, reports, records/new, settings(로그아웃),
settings/withdraw(탈퇴), useDeletePet까지 6곳으로 늘었다. 포트폴리오 코드
리뷰에서 "zustand 의존성은 설치돼 있는데 실사용 사례가 0건"이라는 지적이
나왔고, 이 상태를 zustand로 옮기는 리팩토링을 진행했다.

---

## Problem

리팩토링 직후 자동 코드 리뷰(Qodo)가 실제 정합성 버그 3건을 지적했다.

1. `reports/page.tsx`가 URL의 `petId`를 우선시하면서도, 탭을 직접 클릭할
   때만 store에 값을 반영했다 — 딥링크나 뒤로가기로 들어오면 store가 URL과
   다른 값을 들고 있을 수 있었다.
2. `home/page.tsx`가 `selectedPetId`가 없거나 무효할 때 첫 번째 pet으로
   폴백해서 렌더링하면서도, 그 폴백 결과를 store에 다시 쓰지 않았다.
3. `records/new/page.tsx`가 폼에서 pet을 수동으로 바꿔도 로컬 상태만
   갱신하고 store는 그대로였다.

세 버그 모두 같은 패턴이다: **"현재 선택된 pet"이라는 개념을 여러 화면이
공유해야 하는데, 그 값을 확정하는 지점(URL 해석, 폴백 선택, 폼 내 수동 선택)
전부가 "다시 store에 써야 한다"는 계약을 지켜야 했고, 실제로는 하나가
빠졌다.** `016`이 만든 `localStorage` 유틸은 각 호출부가 스스로
`get`/`set`을 알아서 챙기는 구조라, 이 계약을 코드가 강제하지 않았다 —
사람이 매 호출부마다 기억해야 했고, 6곳 중 3곳에서 실제로 빠뜨렸다.

---

## Decision

`features/pet/stores/selectedPet.store.ts`에 Zustand `persist` 미들웨어
기반 스토어(`useSelectedPetStore`)를 두고, `localStorage` 유틸을 완전히
대체한다. 스토어는 `selectedPetId`, `setSelectedPetId`,
`clearSelectedPetId(petId)`(해당 pet이 선택돼 있을 때만 해제 — 삭제 시
용도), `reset()`(무조건 해제 — 로그아웃/탈퇴 용도) 네 가지 API만 노출한다.

읽기/쓰기 지점 6곳(home, reports, records/new, settings, settings/withdraw,
useDeletePet) 전부가 이 스토어 하나만 참조하도록 통일했고, 위 3개 버그도
각 화면이 값을 확정하는 시점에 `setSelectedPetId`를 호출하도록 고쳤다.

---

## Reason

### 016의 전제가 실제로는 성립하지 않았다

`016`은 "초기값만 정하면 되는 문제"라고 봤지만, 실제 요구는 "여러 라우트가
같은 값을 실시간으로 공유해야 한다"였다 — 리포트 화면에서 pet을 바꾸면
홈에서도 그 pet이 마지막 선택으로 남아야 하는가 같은 질문에 답이
필요했고, 답은 "그렇다"였다. 이건 `007`이 정의한 "초기값 결정" 문제가
아니라 진짜 공유 상태 문제였다.

### 재구현 가능한 API보다 단일 진입점이 계약을 강제한다

`localStorage` 유틸은 순수 함수라 어디서든 자유롭게 불러 쓸 수 있는
대신, "이 값을 쓰는 모든 곳이 항상 최신값을 쓰고 있는가"를 코드가 보장하지
않는다. Zustand 스토어로 좁히면 읽기/쓰기가 훅 하나(`useSelectedPetStore`)
로 수렴해, "이 값을 누가 쓰는지" grep 한 번으로 추적할 수 있고, 스토어
파일 상단 주석에 "확정되는 모든 지점에서 반드시 setSelectedPetId를
호출해야 한다"는 계약을 명시해 다음 버그를 예방한다.

### 016이 우려했던 SSR 안전성은 커스텀 storage로 해결

`persist` 미들웨어의 기본 storage(`window.localStorage`)를
`typeof window === 'undefined'` 체크와 `try/catch`로 감싼 `safeStorage`로
교체해, `016`이 유틸 함수 레벨에서 챙기던 SSR-safety와 시크릿 모드 대응을
그대로 유지했다.

### 도메인 배치: shared가 아닌 pet

최초 구현은 `features/shared/stores`에 뒀으나, 코드 리뷰에서 "pet
도메인 개념인데 shared에 있다"는 지적을 받아 `features/pet/stores`로
옮겼다 — `selectedPetId`는 여러 화면이 참조하긴 해도 개념 자체는 pet
도메인 소유이지, 기술적으로 여러 기능이 공유한다고 해서 shared가 되는 건
아니다.

---

## Trade-off

- 전역 상태가 하나 늘었다. `007`의 "전역 상태 남용 금지" 원칙과
  충돌하지 않으려면, 앞으로 이 스토어에 다른 개념(예: 알림 배지 카운트)을
  얹지 않고 "선택된 pet" 용도로만 좁게 유지해야 한다.
- "크로스 라우트 단일 소스" 계약은 여전히 사람이 챙겨야 하는 규율이다 —
  새 화면이 pet을 확정하는 지점을 추가하면서 `setSelectedPetId` 호출을
  빠뜨리면 같은 종류의 버그가 재발할 수 있다. 스토어 파일 상단 주석이
  유일한 안전장치다.
- 저장 포맷이 raw string(`petlog:lastSelectedPetId`)에서 zustand persist의
  JSON 포맷으로 바뀌어, 기존 값과 충돌하지 않도록 스토리지 키를
  `petlog:selected-pet`으로 새로 발급했다. 기존 사용자의 `localStorage`에
  남은 구 키는 더 이상 읽히지 않고 방치되지만(용량 무시할 수준), 값 자체가
  "마지막 선택 pet" 편의 정보라 데이터 유실로 인한 리스크는 없다.
