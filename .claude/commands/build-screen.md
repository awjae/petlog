---
description: 기획 → 디자인 → 구현 3단계로 클라이언트 화면을 설계하고 구현한다
---

구현할 화면/기능: $ARGUMENTS

product-planner → ui-designer → frontend-architect 순서로 에이전트를 실행한다.
각 단계의 산출물이 다음 단계의 입력이 된다.

---

## Phase 1 — 기획 (product-planner)

product-planner 에이전트를 실행한다.

다음을 산출한다:
- 화면 목적과 사용자 문제
- 진입 경로와 다음 화면
- 주요 요소 목록 (표시할 정보, 가능한 액션)
- 상태별 처리 (로딩 / 빈 상태 / 정상 / 에러)
- 사용자 시나리오 (Happy Path + 대안 흐름)
- Edge Case

Phase 1 산출물을 확정한 후 Phase 2로 넘어간다.

---

## Phase 2 — 디자인 (ui-designer)

ui-designer 에이전트를 실행한다.
Phase 1 산출물(화면 명세)을 입력으로 전달한다.

다음을 산출한다:
- 화면 레이아웃 구조 (헤더, 콘텐츠 영역, 하단 액션)
- 필요한 컴포넌트 목록과 각각의 시각 명세
  - 크기 / 색상 / 타이포그래피 / 간격
  - 상태별 외형 (Default / Pressed / Disabled / Loading / Error)
- 인터랙션 정의 (바텀 시트, 스와이프, 전환 애니메이션)
- 빈 상태 / 에러 상태 시각 처리

Phase 2 산출물을 확정한 후 Phase 3으로 넘어간다.

---

## Phase 3 — 구현 (frontend-architect)

frontend-architect 에이전트를 실행한다.
Phase 1 산출물(화면 명세) + Phase 2 산출물(디자인 명세)을 입력으로 전달한다.

다음을 구현한다:

```
src/features/<feature>/
├── components/   # UI 컴포넌트 (디자인 명세 기반)
├── hooks/        # useQuery / useMutation (Apollo Client)
├── api/          # GraphQL 쿼리/뮤테이션 문서
└── types/        # 도메인 타입

src/app/<route>/
└── page.tsx      # Next.js App Router 페이지
```

구현 기준:
- 컴포넌트는 UI만 담당. Apollo 훅은 feature/hooks에서 호출
- 모든 비동기 상태 처리: Loading / Error / Empty / Success
- 모바일 기준 (390px), 터치 타겟 최소 44px
- TypeScript strict. `any` 금지

---

## 단계 간 전달 원칙

- Phase 1 → Phase 2: 화면 명세 전문을 전달한다
- Phase 2 → Phase 3: 화면 명세 + 디자인 명세 전문을 전달한다
- 앞 단계에서 정의되지 않은 내용을 다음 단계에서 임의로 결정하지 않는다
- 앞 단계 결과에 문제가 있으면 해당 에이전트에 재질의한다
