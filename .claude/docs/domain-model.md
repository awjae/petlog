# Petlog Domain Model

## 1. Domain Overview

Petlog의 핵심 목적은 반려동물 보호자가 반려동물의 건강 데이터를 기록하고 변화 흐름을 이해할 수 있도록 돕는 것이다.

도메인은 다음 기준으로 설계한다.

- 사용자 중심
- 건강 데이터의 지속적인 축적
- 향후 AI 분석 확장 가능성
- 실제 서비스 운영 고려

---

# 2. Core Domain Relationship

전체 관계:

User
└── Pet
    ├── HealthRecord
    ├── MedicalEvent
    ├── Medication
    └── Report

---

# 3. User Domain

## Purpose

반려동물을 관리하는 보호자 계정.

## Responsibility

- 사용자 인증
- 사용자 정보 관리
- 소유 반려동물 관리

## Main Attributes

id
- 사용자 식별자

email
- 로그인 계정

name
- 사용자 이름

createdAt
- 생성 시간

updatedAt
- 수정 시간

## Relationship

User는 여러 Pet을 가질 수 있다.

관계: User 1:N Pet


---

# 4. Pet Domain

## Purpose

보호자가 관리하는 반려동물 정보.

## Responsibility

- 반려동물 기본 정보 관리
- 건강 기록 연결
- AI 분석 대상 데이터 제공

## Main Attributes

id
- 반려동물 식별자

userId
- 소유자 식별자

name
- 이름

species
- 종류
- 예: Dog, Cat

breed
- 품종

birthDate
- 생년월일

gender
- 성별

weight
- 몸무게

createdAt
- 생성 시간

updatedAt
- 수정 시간

## Relationship

Pet은 여러 HealthRecord를 가진다.

관계: Pet 1:N HealthRecord

Pet은 여러 MedicalEvent를 가진다.

관계: Pet 1:N MedicalEvent

Pet은 여러 Medication을 가진다.

관계: Pet 1:N Medication

Pet은 여러 Report를 가진다.

관계: Pet 1:N Report

---

# 5. HealthRecord Domain

## Purpose

반려동물의 일상 건강 데이터를 기록한다.

## Responsibility

- 건강 변화 기록
- 시간 흐름 기반 데이터 관리
- AI 분석 데이터 제공

## Main Attributes

id
- 건강 기록 식별자

petId
- 반려동물 식별자

type
- 기록 종류
- 예: weight, appetite, activity, symptom

value
- 기록 값

note
- 사용자 메모

recordedAt
- 기록 시간

createdAt
- 생성 시간

## Example

몸무게:
- type: weight
- value: 4.5kg

식욕:
- type: appetite
- value: normal

---

# 6. MedicalEvent Domain

## Purpose

병원 방문 및 의료 관련 이벤트 관리.

## Responsibility

- 병원 방문 기록
- 진료 내용 저장
- 검사 결과 관리

## Main Attributes

id
- 진료 이벤트 식별자

petId
- 반려동물 식별자

hospitalName
- 병원명

visitDate
- 방문 날짜

description
- 진료 내용

attachment
- 이미지 또는 파일 정보

createdAt
- 생성 시간

---

# 7. Medication Domain

## Purpose

약 복용 및 관리 정보.

## Responsibility

- 복용 기록 관리
- 보호자의 관리 지원

## Main Attributes

id
- 약 정보 식별자

petId
- 반려동물 식별자

name
- 약 이름

dosage
- 용량

frequency
- 복용 주기

startDate
- 시작일

endDate
- 종료일

---

# 8. Report Domain

## Purpose

건강 데이터를 기반으로 생성되는 AI 분석 리포트. 핵심 차별화 기능이다.

## Responsibility

- 건강 변화 요약
- AI 분석 결과 저장
- 보호자가 이해하기 쉬운 형태 제공

## Main Attributes

id
- 리포트 식별자

petId
- 반려동물 식별자

type
- 리포트 종류
- 예: weekly, monthly

summary
- 요약 내용

generatedBy
- 생성 방식
- 예: mock, llm

periodStart
- 분석 기간 시작일

periodEnd
- 분석 기간 종료일

createdAt
- 생성 시간


---

# 9. Domain Rules

## Pet Ownership

모든 건강 데이터는 반드시 Pet에 연결된다.

잘못된 구조:

HealthRecord
↓
User

올바른 구조:

HealthRecord
↓
Pet
↓
User

---

## Health Data History

건강 데이터는 수정보다 기록 축적을 우선한다.

기록의 시간 흐름이 중요하다.

---

## AI Independence

Report는 AI Provider와 직접 연결하지 않는다.

구조:

Report
↓
Health Analysis Service
↓
AI Provider

---

# 10. Future Expansion

향후 확장 가능 도메인:

## Vaccine

예방접종 관리

## Nutrition

식단 관리

## Activity

운동량 관리

## Insurance

보험 기록 관리

## Community

보호자 커뮤니티

---

# 11. Domain Decision Rule

새로운 기능 추가 시 먼저 확인한다.

질문:

1. 새로운 도메인인가?
2. 기존 도메인의 책임인가?
3. 데이터 관계는 어떻게 되는가?
4. 향후 확장 가능한 구조인가?

도메인의 책임을 명확히 유지한다.
