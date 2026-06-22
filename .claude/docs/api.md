# Petlog API Design

## 1. API Overview

Petlog API는 Frontend와 Backend 사이의 명확한 계약(Contract)을 정의한다.

목표:

- 일관된 데이터 흐름
- 명확한 책임 분리
- 확장 가능한 API 구조
- 타입 기반 개발

API Style:

- REST API
- JSON Response
- Resource 중심 설계

---

# 2. API Principles

## Resource Based Design

API는 화면 기준이 아닌 Domain Resource 기준으로 설계한다.

예:

좋지 않은 방식:

GET /getPetHealth

좋은 방식:

GET /pets/:petId/health-records

---

## Consistent Response

모든 API는 일관된 응답 구조를 유지한다.

Success:

{
  data,
  message
}

Error:

{
  code,
  message,
  details
}

---

# 3. Authentication API

## POST /auth/signup

Purpose: 사용자 회원가입

Request:
- email
- name
- password

Response:
- user 정보 반환

---

## POST /auth/login

Purpose: 로그인

Request:
- email
- password

Response:
- accessToken
- user

---

# 4. Pet API

## POST /pets

Purpose: 반려동물 등록

Request:
- name
- species
- breed
- birthDate
- gender
- weight

Response:
- Pet Entity

---

## GET /pets

Purpose: 사용자가 관리하는 반려동물 목록 조회

Response:
- Pet[]

---

## GET /pets/:petId

Purpose: 반려동물 상세 조회

Response:
- Pet

---

## PATCH /pets/:petId

Purpose: 반려동물 정보 수정

---

## DELETE /pets/:petId

Purpose: 반려동물 삭제

---

# 5. Health Record API

## POST /pets/:petId/health-records

Purpose: 건강 기록 생성

Request:
- type
- value
- note
- recordedAt

Example:
- type: weight
- value: 4.5

---

## GET /pets/:petId/health-records

Purpose: 반려동물 건강 기록 조회

Query:
- startDate
- endDate
- type

Response:
- HealthRecord[]

---

## GET /health-records/:id

Purpose: 건강 기록 상세 조회

---

## DELETE /health-records/:id

Purpose: 건강 기록 삭제

---

# 6. Medical Event API

## POST /pets/:petId/medical-events

Purpose: 병원 방문 기록 생성

Request:
- hospitalName
- visitDate
- description
- attachmentUrl

---

## GET /pets/:petId/medical-events

Purpose: 병원 기록 조회

Response:
- MedicalEvent[]

---

# 7. Medication API

## POST /pets/:petId/medications

Purpose: 약 정보 등록

Request:
- name
- dosage
- frequency
- startDate
- endDate

---

## GET /pets/:petId/medications

Purpose: 복용 중인 약 조회

Response:
- Medication[]

---

# 8. Report API

## POST /pets/:petId/reports/generate

Purpose: 건강 리포트 생성 요청

Flow:

Pet Health Data
↓
Report Service
↓
AI Provider
↓
Report 저장

Request:
- type (예: weekly)

---

## GET /pets/:petId/reports

Purpose: 생성된 리포트 목록 조회

Response:
- Report[]

---

## GET /reports/:reportId

Purpose: 리포트 상세 조회

Response:
- Report

---

# 9. AI API Principle

AI API는 직접 Provider를 노출하지 않는다.

잘못된 구조:

Frontend
↓
OpenAI API

올바른 구조:

Frontend
↓
Backend
↓
AI Service
↓
Provider

---

# 10. Error Handling

Error Category:

## Validation Error

예: 필수 값 누락

HTTP: 400

---

## Authentication Error

예: 로그인 필요

HTTP: 401

---

## Authorization Error

예: 다른 사용자의 Pet 접근

HTTP: 403

---

## Resource Not Found

예: 존재하지 않는 Pet

HTTP: 404

---

## Server Error

예: 외부 AI 실패

HTTP: 500

---

# 11. API Versioning

초기:

/api

확장 시:

/api/v1

Breaking Change 발생 시 Version 관리한다.

---

# 12. DTO Rules

Request / Response는 DTO로 관리한다.

Controller에서 Entity를 직접 반환하지 않는다.

구조:

Controller
↓
DTO
↓
Service
↓
Entity

---

# 13. API Development Rule

새로운 API 추가 시 확인:

1. 기존 Domain 책임인가?
2. Resource 기준인가?
3. Request / Response가 명확한가?
4. Error Case가 정의되어 있는가?
5. Frontend 사용 흐름과 맞는가?

API는 단순 데이터 전달이 아니라 제품의 계약이다.
