---
description: DB 스키마가 도메인 모델과 일치하는지 검사한다
---

검사 대상 (파일 경로 또는 도메인명): $ARGUMENTS

PostgreSQL 스키마와 Petlog 도메인 모델의 정합성을 검사한다.

---

## 검사 항목

### 1. 도메인-테이블 매핑
도메인 모델에서 정의된 엔티티가 테이블로 존재하는지 확인한다.

| 도메인 | 테이블 | 상태 |
|--------|--------|------|
| User   | users  | ?    |
| Pet    | pets   | ?    |
| HealthRecord | health_records | ? |
| MedicalEvent | medical_events | ? |
| Medication | medications | ? |
| Report | reports | ? |

### 2. 관계 무결성
- users → pets: userId FK 존재 여부
- pets → health_records: petId FK 존재 여부
- pets → medical_events: petId FK 존재 여부
- pets → medications: petId FK 존재 여부
- pets → reports: petId FK 존재 여부
- ON DELETE 동작 확인 (CASCADE vs RESTRICT)

### 3. 필수 필드 존재 여부
- 모든 테이블에 id, createdAt, updatedAt 존재 여부
- HealthRecord: type, value, recordedAt 필드 타입 적합성
- Report: generatedBy 필드 ('mock' | 'llm' enum 또는 string)

### 4. AI 소비 데이터 구조화
AI가 소비할 데이터가 구조화된 형태로 저장되는지 확인한다:
- HealthRecord.type: weight, appetite, activity, symptom 등 enum 타입
- HealthRecord.value: AI가 파싱 가능한 형식인가?

### 5. 인덱스
- pets(userId) 인덱스 존재 여부
- health_records(petId, recordedAt) 복합 인덱스 존재 여부 (시간 기반 조회 최적화)

---

## 출력 형식

```
## 스키마 정합성 결과

### 일치 항목 ✓
- ...

### 불일치 또는 누락 ✗
- 도메인 필드 X → 테이블에 없음 → 추가 필요
- ...

### 개선 권장
- ...
```
