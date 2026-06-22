# Decision: 데이터 모델링 방향

## Context

반려동물 건강 데이터를 어떻게 저장할 것인가에 대한 결정이 필요했다.

건강 데이터는 다음 특성을 가진다.

- 종류가 다양하다 (몸무게, 식욕, 활동량, 증상 등)
- 시간 흐름이 중요하다
- 향후 AI 분석의 입력 데이터가 된다

---

## Problem

건강 데이터 저장 방식 선택.

가능한 방향:

1. 건강 항목별 별도 테이블 (weight_records, appetite_records ...)
2. 단일 health_records 테이블 + type 컬럼
3. Pet 테이블의 컬럼으로 현재 값만 저장

---

## Decision

단일 health_records 테이블 + type 컬럼 방식을 선택한다.

Schema:

```
health_records
  id
  pet_id
  type       (weight | appetite | activity | symptom)
  value
  note
  recorded_at
  created_at
```

---

## Reason

### 시간 흐름 보존

건강 데이터는 덮어쓰지 않고 축적한다.

과거 기록이 AI 분석의 핵심 데이터가 되기 때문이다.

### 확장성

새로운 건강 항목 추가 시 테이블 변경 없이 type 값만 추가하면 된다.

### 단순성

항목별 테이블 분리는 조회 시 JOIN이 복잡해진다.

초기에는 단순한 구조를 유지한다.

---

## Trade-off

### 단점

type별로 value 형식이 다를 수 있다.

예:

- weight: 숫자 (4.5)
- appetite: 텍스트 (normal, low, high)

이 경우 value 컬럼의 타입이 범용적이어야 한다.

### 대응

value를 TEXT로 저장하고, 애플리케이션 레이어에서 type에 따라 파싱한다.

향후 데이터가 복잡해지면 JSON 컬럼 또는 type별 메타데이터 테이블로 확장 가능하다.

---

## Pet 테이블 weight 컬럼 관계

Pet 테이블에도 weight 컬럼이 있다.

이는 등록 시 기본 몸무게이다.

실제 몸무게 변화는 health_records에 기록한다.

두 값의 역할이 다르다.

---

## Status

현재 설계로 MVP를 진행한다.

향후 데이터가 쌓인 후 조회 패턴을 분석하여 필요 시 최적화한다.
