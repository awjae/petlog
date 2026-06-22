# Petlog Database Design

## 1. Database Overview

Petlog는 PostgreSQL을 Source of Truth로 사용한다.

Database 설계 목표:

- 도메인 모델과 일치하는 데이터 구조
- 데이터 무결성 유지
- 확장 가능한 관계 설계
- 조회 패턴을 고려한 구조

---

# 2. Database Principles

## Domain First

테이블은 화면 기준이 아니라 도메인 기준으로 설계한다.

핵심 Entity:

- users
- pets
- health_records
- medical_events
- medications
- reports

---

## Data Integrity

데이터 관계는 명확하게 관리한다.

원칙:

- Foreign Key 사용
- 필수 데이터 검증
- 잘못된 상태 방지

---

## History First

반려동물 건강 데이터는 시간 흐름이 중요하다.

기존 데이터를 덮어쓰기보다 기록을 축적한다.

예:

잘못된 방식: weight = 5.2

올바른 방식: health_records에 날짜별 몸무게 기록

---

# 3. Entity Relationship

전체 관계:

- users 1:N pets
- pets 1:N health_records
- pets 1:N medical_events
- pets 1:N medications
- pets 1:N reports

---

# 4. users Table

## Purpose

서비스 사용자 계정 관리.

## Schema

id
- UUID
- Primary Key

email
- 로그인 이메일
- Unique

name
- 사용자 이름

created_at
- 생성 시간

updated_at
- 수정 시간

---

# 5. pets Table

## Purpose

사용자가 관리하는 반려동물 정보.

## Schema

id
- UUID
- Primary Key

user_id
- Foreign Key
- users.id

name
- 반려동물 이름

species
- 동물 종류

breed
- 품종

birth_date
- 생년월일

gender
- 성별

weight
- 현재 몸무게

created_at
- 생성 시간

updated_at
- 수정 시간

---

# 6. health_records Table

## Purpose

일상 건강 데이터 저장.

## Schema

id
- UUID
- Primary Key

pet_id
- Foreign Key
- pets.id

type
- 기록 종류
- 예: weight, appetite, activity, symptom

value
- 기록 값

note
- 사용자 메모

recorded_at
- 기록 시간

created_at
- 생성 시간

---

# 7. medical_events Table

## Purpose

병원 방문 및 의료 기록.

## Schema

id
- UUID
- Primary Key

pet_id
- Foreign Key
- pets.id

hospital_name
- 병원명

visit_date
- 방문 날짜

description
- 진료 내용

attachment_url
- 첨부 파일 위치

created_at
- 생성 시간

---

# 8. medications Table

## Purpose

약 복용 정보 관리.

## Schema

id
- UUID
- Primary Key

pet_id
- Foreign Key
- pets.id

name
- 약 이름

dosage
- 용량

frequency
- 복용 주기

start_date
- 시작일

end_date
- 종료일

created_at
- 생성 시간

---

# 9. reports Table

## Purpose

건강 데이터 분석 결과 저장.

## Schema

id
- UUID
- Primary Key

pet_id
- Foreign Key
- pets.id

type
- 리포트 종류
- 예: weekly, monthly

summary
- 분석 결과

generated_by
- 생성 방식
- 예: mock, ai

created_at
- 생성 시간

---

# 10. Index Strategy

초기 Index 기준:

## pets

user_id

이유: 사용자의 반려동물 조회 빈도가 높음.

---

## health_records

pet_id, recorded_at

이유: 반려동물별 시간순 건강 기록 조회.

---

## medical_events

pet_id, visit_date

이유: 병원 기록 조회.

---

# 11. Migration Rules

Database 변경은 Migration으로 관리한다.

금지:

- 운영 DB 직접 수정

변경 시:

1. Migration 작성
2. Schema 검증
3. 테스트 환경 적용
4. Production 적용

---

# 12. Query Design Principle

조회 패턴을 먼저 고려한다.

예:

사용자 화면: "내 반려동물 최근 건강 상태"

필요 Query:

pet
↓
recent health_records

---

# 13. Soft Delete Policy

초기에는 물리 삭제보다 Soft Delete 고려.

필요 Entity:

- pets
- health_records

추가 가능: deleted_at

---

# 14. Future Expansion

추가 가능한 Entity:

## Vaccinations

예방접종 기록

## Nutrition

식단 관리

## ActivityLogs

활동량 기록

## Insurance

보험 정보

---

# 15. Database Decision Rule

새로운 데이터 추가 시 확인:

1. 기존 Entity 책임인가?
2. 새로운 Domain인가?
3. 관계가 명확한가?
4. 조회 패턴이 예상되는가?
5. 향후 확장 가능한가?

Database는 화면 구현을 위한 저장소가 아니라 제품의 핵심 데이터 모델이다.
