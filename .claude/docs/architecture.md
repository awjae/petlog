# Petlog Architecture

## 1. Architecture Overview

Petlog는 모바일 우선 웹 기반의 풀스택 서비스이다.

목표:

- 빠른 사용자 경험 제공
- 유지보수 가능한 구조
- 기능 확장 가능성 확보
- AI 기능 추가를 고려한 구조 설계

## System Architecture

Client
↓
Next.js Application
↓
NestJS API Server
↓
PostgreSQL Database

AI Layer (Optional)
↓
AI Provider

---

# 2. Architecture Principles

## Domain First

기술 계층이나 화면 기준이 아닌 비즈니스 도메인 기준으로 설계한다.

핵심 도메인:

- User
- Pet
- HealthRecord
- MedicalEvent
- Medication
- Report

기능 확장 시 도메인 단위로 확장 가능해야 한다.


## Separation of Concerns

각 계층은 명확한 책임을 가진다.

### Frontend

책임:

- 사용자 경험
- UI 표현
- 사용자 입력 처리
- 상태 관리

### Backend

책임:

- 비즈니스 로직
- 데이터 처리
- 권한 관리
- 외부 서비스 연결

### Database

책임:

- 데이터 영속성
- 데이터 관계 관리
- 조회 최적화

### AI Layer

책임:

- 건강 데이터 분석
- 건강 리포트 생성
- AI Provider 추상화

---

# 3. Frontend Architecture

## Tech Stack

- React
- TypeScript
- Next.js

## Architecture Style

Feature Based Architecture를 사용한다.

기술 계층보다 기능/도메인 중심 구조를 선호한다.

예:

src/
features/
- auth
- pet
- health-record
- report
components
hooks
lib
utils

---

# 4. Frontend Responsibility

## Feature

도메인 기능 단위 관리

예:

features/pet
- components
- hooks
- api
- types
- utils

## Components

책임:

- UI Rendering
- 사용자 Interaction

하지 않는 것:

- 직접 API 호출
- 복잡한 비즈니스 로직
- 데이터 가공 로직

## Hooks

책임:

- 데이터 조회
- 상태 연결
- Feature Logic

예:

- usePet()
- useHealthRecord()
- useReport()

## API Layer

Backend 통신 담당.

Component에서 직접 API 요청하지 않는다.

데이터 흐름:

Component
↓
Hook
↓
API Layer
↓
Backend

---

# 5. Backend Architecture

## Tech Stack

- NestJS
- TypeScript

## Module Structure

도메인 기준으로 구성한다.

예:

src/
- auth
- user
- pet
- health-record
- report
- ai

---

# 6. Backend Layer Responsibility

## Controller

책임:

- Request 처리
- Validation
- Response 반환

Controller에는 비즈니스 로직을 작성하지 않는다.

## Service

핵심 비즈니스 로직 담당.

예:

- 건강 기록 생성
- 리포트 생성
- 사용자 권한 검증

## Repository / Data Access

Database 접근 담당.

Service가 Database 구현 세부사항에 직접 의존하지 않도록 한다.

---

# 7. Data Flow

User Action
↓
Frontend Component
↓
Feature Hook
↓
API Layer
↓
NestJS Controller
↓
Service
↓
Database

---

# 8. AI Architecture

AI 기능은 초기부터 확장 가능한 구조로 설계한다.

현재: Mock AI Provider

향후: LLM Provider

구조:

Report Service
↓
HealthReportGenerator Interface
↓
MockHealthReportGenerator
↓
LLMHealthReportGenerator

---

# 9. AI Integration Rule

비즈니스 로직은 특정 AI Provider에 직접 의존하지 않는다.

잘못된 구조:

ReportService
↓
OpenAI API 직접 호출

올바른 구조:

ReportService
↓
HealthReportGenerator
↓
AI Provider

목표:

- Mock 개발 가능
- 실제 AI Provider 교체 가능
- 테스트 가능한 구조

---

# 10. Database Architecture

Database: PostgreSQL

기본 관계:

User
└── Pet
    └── HealthRecord
          └── Report

설계 원칙:

- 명확한 관계 정의
- 데이터 무결성 유지
- 조회 패턴 고려
- 필요한 부분만 최적화

---

# 11. Error Handling

모든 계층에서 실패 상황을 고려한다.

Frontend:

- Loading
- Success
- Empty
- Error

Backend:

- Validation Error
- Business Error
- External Service Error

AI:

- Timeout
- Provider Failure
- Invalid Response

---

# 12. Scalability Consideration

초기에는 단순한 구조를 유지한다.

하지만 확장 가능성을 고려한다.

AI:

Mock Provider
↓
LLM Provider

Storage:

Local Storage
↓
Object Storage

Application:

Single Server
↓
Service 분리 가능 구조

---

# 13. Architecture Decision Rule

기술 선택 기준:

1. 사용자 가치
2. 유지보수성
3. 단순성
4. 확장 가능성

새로운 기술 적용 자체가 목적이 아니다.

제품 문제 해결을 우선한다.
