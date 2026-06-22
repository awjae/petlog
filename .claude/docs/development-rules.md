# Petlog Development Rules

## 1. Development Philosophy

Petlog는 단순 기능 구현 프로젝트가 아니라 실제 서비스를 개발하는 프로덕트 엔지니어링 프로젝트이다.

모든 개발 판단은 다음 기준을 따른다.

우선순위:

1. 사용자 가치
2. 제품 완성도
3. 유지보수성
4. 확장 가능성
5. 기술적 흥미

새로운 기술 적용 자체를 목표로 하지 않는다.

문제 해결과 제품 품질 향상을 우선한다.

---

# 2. Code Quality Principles

## Readability First

코드는 작성자보다 다른 개발자가 이해하기 쉬워야 한다.

선호:

- 명확한 변수명
- 작은 함수
- 단일 책임
- 의도가 드러나는 구조

피한다:

- 과도한 축약
- 복잡한 조건문
- 의미 없는 추상화

---

# 3. Optimization Principle

성능 최적화는 측정 후 진행한다.

하지 않는다:

- 근거 없는 최적화
- 불필요한 메모이제이션
- 복잡한 캐싱 구조
- 필요 없는 라이브러리 추가

---

# 4. TypeScript Rules

TypeScript는 타입 검사를 위한 도구가 아니라 코드 문서 역할을 한다.

## Required

사용:

- 명확한 Type
- Interface
- Enum
- Domain Type

## Forbidden

금지: any 사용

타입 오류를 숨기지 않는다.

필요한 경우 명확한 변환 로직을 작성한다.

---

# 5. Naming Convention

## Variable

의미가 명확한 이름 사용.

좋은 예:

- healthRecordList
- petProfile
- generatedReport

나쁜 예:

- data
- item
- value

---

## Function

동작을 표현한다.

좋은 예:

- createHealthRecord()
- generateHealthReport()
- fetchPetProfile()

---

## Boolean

상태를 표현한다.

좋은 예:

- isLoading
- hasPermission
- isCompleted

---

# 6. Frontend Rules

## Component Responsibility

Component는 UI 표현에 집중한다.

Component에서 하지 않는다:

- 직접 API 호출
- 복잡한 비즈니스 로직
- 데이터 변환

---

## Data Flow

데이터 흐름:

Component
↓
Hook
↓
API Layer
↓
Backend

Component가 데이터 출처를 직접 관리하지 않는다.

---

## State Management

상태 목적을 구분한다.

Local State:

- Input
- Modal
- UI 상태

Server State:

- API 데이터
- Cache 데이터

Global State:

- 정말 필요한 전역 상태

전역 상태 남용 금지.

---

# 7. Backend Rules

## Controller

Controller는 얇게 유지한다.

Controller 책임:

- Request 전달
- Validation
- Response 반환

비즈니스 로직 작성 금지.

---

## Service

Service에서 비즈니스 로직을 관리한다.

예:

- 데이터 처리
- 도메인 규칙
- 외부 서비스 호출 조합

---

## Module

NestJS Module은 도메인 기준으로 구성한다.

예:

pet
- controller
- service
- repository
- dto
- entity

---

# 8. Database Rules

Database 설계 기준:

- 도메인 모델 중심
- 데이터 무결성 우선
- 명확한 관계 정의

고려:

- 조회 패턴
- Index 필요성
- 데이터 확장

과도한 최적화는 피한다.

---

# 9. API Rules

API는 명확한 계약(Contract)을 가진다.

필수:

- Request Type 정의
- Response Type 정의
- Error Case 정의

API 변경 시:

- 기존 사용자 영향 고려
- Backward Compatibility 고려

---

# 10. Error Handling Rules

실패 상황은 정상적인 흐름으로 처리한다.

Frontend:

- Loading
- Empty
- Error

Backend:

- Validation Error
- Business Error
- External Error

사용자가 다음 행동을 알 수 있어야 한다.

---

# 11. AI Development Rules

AI 기능은 Provider에 직접 의존하지 않는다.

구조:

Business Logic
↓
AI Interface
↓
Provider

현재: Mock AI 구현

향후: LLM Provider 교체 가능

---

# 12. Testing Rules

테스트 우선순위:

1. 핵심 비즈니스 로직
2. 데이터 변환 로직
3. 사용자 핵심 흐름

단순 UI Snapshot보다 실제 동작 검증을 우선한다.

---

# 13. Git Rules

## Branch

기능 단위 브랜치 사용.

예:

- feature/pet-health-record
- feature/ai-report
- fix/report-loading-error

---

## Commit

작은 단위로 작성한다.

형식:

type: description

예:

- feat: add pet health record api
- fix: handle report generation error
- refactor: simplify health record service

---

# 14. Documentation Rules

중요한 기술 결정은 문서화한다.

작성 대상:

- Architecture Decision
- 기술 선택 이유
- Trade-off

문서 목적:

무엇을 했는가보다 왜 이렇게 했는가를 기록한다.

---

# 15. Review Checklist

## Product

- 사용자 문제를 해결하는가?

## Architecture

- 책임이 명확한가?
- 확장 가능한 구조인가?

## Code

- 읽기 쉬운가?
- 변경하기 쉬운가?

## Performance

- 불필요한 비용이 없는가?

## Testing

- 핵심 동작이 검증되는가?

---

# 16. Final Rule

빠르게 만드는 것보다 올바르게 성장 가능한 구조를 만든다.

Petlog는 기능 모음이 아니라 실제 서비스로 발전 가능한 제품 구조를 목표로 한다.
