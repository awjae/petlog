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

값은 단일 String 컬럼 대신 타입 특성에 따라 두 컬럼으로 분리한다.

### Schema

```
health_records
  id
  pet_id
  type        (weight | appetite | activity | symptom | stool | vomit | mood)
  num_value   DECIMAL(8,2) NULL  — 수치 기록 (weight)
  text_value  TEXT NULL          — 문자열 기록 (appetite, activity, symptom 등)
  note
  recorded_at
  created_at / updated_at / deleted_at
```

### type별 컬럼 사용 규칙

| type | num_value | text_value |
|------|-----------|------------|
| weight | 체중 수치 (예: 4.50) | NULL |
| appetite | NULL | "none" \| "low" \| "normal" \| "high" |
| activity | NULL | "low" \| "normal" \| "high" |
| symptom | NULL | 자유 텍스트 |
| stool | NULL | 자유 텍스트 |
| vomit | NULL | 자유 텍스트 |
| mood | NULL | 자유 텍스트 |

서비스 레이어에서 type에 따라 어느 컬럼을 채울지 검증한다. DB 레벨에서는 두 컬럼 모두 nullable이다.

---

## Reason

### 단일 String 컬럼을 사용하지 않는 이유

초기 설계에서 `value String`으로 통일하는 방향을 검토했으나 세 가지 문제로 기각했다.

1. **데이터 오염**: `"4.5"`, `"4.5kg"`, `"4500g"` 이 세 가지가 동시에 저장되는 것을 DB 레벨에서 막을 수 없다.
2. **AI 분석 불가**: 체중 추이를 집계하려면 파싱이 필요하고, 파싱 실패는 리포트 버그로 직결된다.
3. **enum성 값 오염**: appetite가 `"normal"`, `"보통"`, `"Normal"` 혼재 시 의미 있는 집계 불가.

### numValue + textValue 분리의 이유

JSONB 방식(`valueJson Json`)과 비교했을 때:

- **쿼리 단순성**: `WHERE num_value > 5.0` vs `WHERE value_json->>'value' > '5.0'`
- **인덱스 효율**: Decimal 컬럼은 B-tree 인덱스가 그대로 적용된다. JSONB는 GIN 인덱스가 필요하다.
- **타입 안전성**: ORM 레벨에서 Decimal 타입이 보장된다.

### 시간 흐름 보존

건강 데이터는 덮어쓰지 않고 축적한다.

과거 기록이 AI 분석의 핵심 데이터가 되기 때문이다.

### 확장성

새로운 건강 항목 추가 시 테이블 변경 없이 type enum 값만 추가하면 된다.

수치/문자열 분류가 명확한 한 컬럼 구조 변경 없이 흡수 가능하다.

---

## TypeScript 타입 설계

```typescript
// type에 따라 어느 컬럼이 필수인지 Discriminated Union으로 강제
type CreateHealthRecordInput =
  | {
      type: HealthRecordType.Weight;
      numValue: number;      // 필수
      textValue?: never;     // 금지
      recordedAt: Date;
    }
  | {
      type: Exclude<HealthRecordType, HealthRecordType.Weight>;
      numValue?: never;      // 금지
      textValue: string;     // 필수
      recordedAt: Date;
    };
```

컴파일 타임에 잘못된 조합을 차단한다.

---

## Pet 테이블 weight 컬럼 관계

Pet 테이블의 `weight Decimal?`는 반려동물 등록 시 기준 몸무게다.

실제 몸무게 변화 추이는 health_records에 기록한다.

두 값의 역할이 다르다. 동기화는 서비스 레이어에서 선택적으로 처리한다.

`Float` 대신 `Decimal(5, 2)`을 사용하는 이유: Float의 부동소수점 오차로 4.5kg가 4.499999...로 저장될 수 있다. 반려동물 체중은 소수점 2자리면 충분하므로 Decimal이 정확하다.

---

## Status

numValue / textValue 분리 구조로 구현 완료. MVP를 진행한다.

향후 데이터가 쌓인 후 조회 패턴을 분석하여 필요 시 최적화한다.
