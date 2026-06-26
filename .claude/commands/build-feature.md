---
description: 정책/도메인 변경을 포함한 기능을 기획 → 디자인 → DB → 백엔드 + 프론트엔드 순서로 설계하고 구현한다
---

구현할 기능 또는 정책 변경: $ARGUMENTS

Phase가 끝날 때마다 사용자 확인을 받은 후 진행한다.

---

## Phase 0 — 영향도 분석 (Claude 직접)

에이전트를 실행하기 전에 코드베이스를 직접 분석한다.
목적: **무엇이 얼마나 깨지는가**를 파악한다. 설계나 기획은 하지 않는다.

### 분석 항목

1. **DB 영향도**
   - 변경/추가 대상 테이블·컬럼
   - 기존 데이터 처리 필요 여부 (NULL 전파, DEFAULT 채우기, 데이터 변환)
   - 연쇄 영향: FK, 인덱스, 다른 테이블의 참조

2. **API 영향도**
   - 변경/추가 대상 엔드포인트
   - Breaking Change 여부 (기존 Request/Response 형태가 바뀌는가)
   - 영향받는 Controller·Service·Repository 파일 목록

3. **화면 영향도**
   - 신규 화면 vs 기존 화면 수정
   - 영향받는 feature 디렉토리와 컴포넌트 파일 목록

4. **리스크**
   - 데이터 유실 가능성
   - 배포 순서 제약 (DB 먼저 → 서버 → 클라이언트 순 배포 필요 여부)
   - 하위 호환 불가 지점

### 출력 형식

```
## 영향도 요약

### DB
| 테이블 | 변경 종류 | 기존 데이터 처리 필요 |
|--------|----------|--------------------|
| ...    | 컬럼 추가 | NULL 허용으로 무중단 가능 |

### API
| 엔드포인트 | 변경 종류 | Breaking Change |
|-----------|---------|----------------|
| ...        | 응답 필드 추가 | 없음 |

### 화면
| feature / 경로 | 변경 종류 |
|---------------|---------|
| ...            | 기존 컴포넌트 수정 |

### 리스크
- [높음 | 중간 | 낮음]: 이유
```

Phase 0 출력 후 "Phase 1로 진행할까요?" 라고 묻는다.

---

## Phase 1 — 기획 (product-planner)

product-planner 에이전트를 실행한다.
Phase 0 영향도 요약을 입력으로 전달한다.

### 산출물

- 기능/정책 변경의 사용자 관점 요구사항 (Why: 이 변경이 사용자에게 무엇을 해결하는가)
- 변경되는 사용자 시나리오 (기존 흐름 → 새 흐름)
- 신규 또는 수정 화면 명세

### 화면 명세 형식

```
## [화면명] (경로) — [신규 | 수정]

### 목적
### 변경 전 vs 변경 후 (수정 화면인 경우)
### 주요 요소
### 상태별 처리 (로딩 / 빈 상태 / 정상 / 에러)
### 사용자 시나리오
### Edge Case
### 다음 화면
```

Phase 1 산출물 확정 후 Phase 2로 넘어간다.

---

## Phase 2 — 디자인 (ui-designer)

ui-designer 에이전트를 실행한다.
Phase 1 화면 명세를 입력으로 전달한다.

### 산출물

- 신규/수정 화면의 레이아웃 구조
- 컴포넌트 디자인 명세 (크기 / 색상 / 타이포그래피 / 간격)
- 상태별 외형 (Default / Pressed / Disabled / Loading / Error)
- 인터랙션 정의 (바텀 시트 진입, 전환 애니메이션, 낙관적 업데이트)
- 기존 화면과 수정 화면의 디자인 일관성 체크

Phase 2 산출물 확정 후 Phase 3으로 넘어간다.

---

## Phase 3 — DB 설계 (db-designer)

db-designer 에이전트를 실행한다.
Phase 0 영향도 요약 + Phase 1 기능 명세를 입력으로 전달한다.

### 산출물

#### 3-1. 스키마 변경
- 신규 테이블 DDL (id UUID / created_at / updated_at 포함)
- 기존 테이블 컬럼 추가/수정/삭제 DDL
- FK 제약 및 ON DELETE 동작 명시
- 인덱스 설계

#### 3-2. 마이그레이션 전략
- Up 마이그레이션 SQL
- Down 마이그레이션 SQL (롤백 가능 여부 판단)
- 기존 데이터 처리 방안 (NULL 허용 / DEFAULT 값 / 데이터 변환)
- Zero-downtime migration 가능 여부

#### 3-3. 영향받는 기존 쿼리
- Phase 0에서 식별된 Repository 파일 중 수정이 필요한 쿼리 목록

```sql
-- Migration: [기능명]
-- Up
ALTER TABLE ...;
CREATE TABLE ...;
CREATE INDEX ...;

-- Down
DROP INDEX ...;
DROP TABLE ...;
ALTER TABLE ...;
```

Phase 3 산출물 확정 후 Phase 4로 넘어간다.

---

## Phase 4 — API 계약 확정 (Claude 직접)

백엔드-프론트엔드 계약을 확정한다. 에이전트 없이 직접 수행한다.
Phase 1 기능 명세 + Phase 3 DB 설계를 바탕으로 작성한다.

```
## API 계약

### [METHOD] /경로

**목적**: 한 줄 설명

**Request**
{ ... }

**Response 200**
{ ... }

**Error Cases**
- 400: ...
- 403: ...
- 404: ...

**Breaking Change**: [있음 | 없음]
```

Phase 4 산출물을 사용자가 확인하면 Phase 5와 Phase 6를 **동시에** 실행한다.

---

## Phase 5 + 6 — 병렬 구현

Phase 4 API 계약이 확정되면 backend-architect와 frontend-architect를 **동시에** 실행한다.

### Phase 5 — 백엔드 구현 (backend-architect)

입력: Phase 3(DB 설계) + Phase 4(API 계약)

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
- Phase 3에서 식별된 기존 쿼리 수정도 함께 처리

### Phase 6 — 프론트엔드 구현 (frontend-architect)

입력: Phase 1(기획) + Phase 2(디자인) + Phase 4(API 계약)

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
- Phase 4 API 계약과 타입 일치

---

## Phase 간 전달 원칙

| Phase | 입력 | 산출물 |
|-------|------|--------|
| Phase 0 | $ARGUMENTS + 코드베이스 | 영향도 요약 (무엇이 깨지는가) |
| Phase 1 | Phase 0 요약 | 화면 명세 + 사용자 시나리오 |
| Phase 2 | Phase 1 명세 | 디자인 명세 |
| Phase 3 | Phase 0 요약 + Phase 1 명세 | DDL + 마이그레이션 SQL |
| Phase 4 | Phase 1 명세 + Phase 3 설계 | API 계약 |
| Phase 5 | Phase 3 + Phase 4 | 백엔드 코드 |
| Phase 6 | Phase 1 + Phase 2 + Phase 4 | 프론트엔드 코드 |

- 앞 단계에서 정의되지 않은 내용을 다음 단계에서 임의로 결정하지 않는다.
- 앞 단계 결과에 문제가 있으면 해당 에이전트에 재질의한다.
- Phase 5와 Phase 6는 Phase 4 확정 이후 병렬 실행한다.
