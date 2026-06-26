---
description: 정책·디자인·스키마가 확정된 상태에서 backend-architect와 frontend-architect를 병렬로 실행해 구현한다
---

구현할 기능: $ARGUMENTS

기획·디자인·DB 설계가 이미 완료된 상태에서 실행한다.
backend-architect와 frontend-architect를 **동시에** 실행한다.

---

## 사전 확인

구현 시작 전에 다음 세 가지가 준비됐는지 확인한다.
준비되지 않은 항목이 있으면 사용자에게 요청한 후 진행한다.

| 항목 | 확인 |
|------|------|
| API 계약 (엔드포인트·Request·Response·Error Cases) | ☐ |
| DB 스키마 (DDL + 마이그레이션 SQL) | ☐ |
| 화면 디자인 명세 (레이아웃·컴포넌트·상태별 외형) | ☐ |

세 가지가 모두 준비되면 "구현을 시작합니다." 라고 알리고 아래 두 Phase를 동시에 실행한다.

---

## Phase 1 — 백엔드 구현 (backend-architect)

입력: API 계약 + DB 스키마

```
backend/src/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts   # 얇게 유지. 검증 + 위임만.
├── <domain>.service.ts      # 비즈니스 로직 + 소유권 검증
├── <domain>.repository.ts   # DB 접근
├── dto/
│   ├── create-<domain>.dto.ts
│   └── update-<domain>.dto.ts
└── entities/
    └── <domain>.entity.ts
```

구현 기준:
- 모든 Pet 관련 API: 소유권 검증 필수 (`pet.userId !== userId → ForbiddenException`)
- DTO: class-validator 데코레이터 사용
- AI 레이어가 있다면 추상화 인터페이스만 사용 (직접 OpenAI import 금지)
- API 계약의 Request/Response 형태와 정확히 일치

---

## Phase 2 — 프론트엔드 구현 (frontend-architect)

입력: API 계약 + 화면 디자인 명세

```
frontend/src/features/<feature>/
├── components/    # UI 컴포넌트 (디자인 명세 기반)
├── hooks/         # useQuery / useMutation
├── api/           # GraphQL 쿼리·뮤테이션 또는 fetch 함수
└── types/         # 도메인 타입

frontend/src/app/<route>/
└── page.tsx       # Next.js App Router 페이지
```

구현 기준:
- 컴포넌트는 UI만 담당. API 호출은 `hooks/`에서
- 모든 비동기 상태: Loading / Error / Empty / Success
- 모바일 기준 (390px), 터치 타겟 최소 44px
- TypeScript strict. `any` 금지
- API 계약과 타입 일치

---

## 완료 기준

두 Phase가 모두 끝나면 다음을 확인한다.

- [ ] 백엔드: API 계약의 모든 엔드포인트 구현 완료
- [ ] 백엔드: 소유권 검증 누락 없음
- [ ] 프론트엔드: 모든 비동기 상태 처리 (Loading / Error / Empty / Success)
- [ ] 프론트엔드: API 계약 타입과 불일치 없음
- [ ] 양쪽: TypeScript 에러 없음
