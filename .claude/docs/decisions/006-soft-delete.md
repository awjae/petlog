# Decision: Soft Delete 정책

## Context

사용자가 반려동물 또는 건강 기록을 삭제하는 경우를 처리해야 한다.

---

## Problem

삭제를 어떻게 처리할 것인가?

가능한 방향:

1. Hard Delete: DB에서 즉시 물리 삭제
2. Soft Delete: deleted_at 컬럼으로 논리 삭제

---

## Decision

`pets`와 `health_records`에 Soft Delete를 적용한다.

`medical_events`, `medications`, `reports`는 Hard Delete를 허용한다.

---

## Reason

### pets에 Soft Delete 적용

반려동물을 삭제해도 연결된 건강 기록이 데이터 분석에 필요할 수 있다.

보호자가 실수로 삭제한 경우 복구 가능성을 열어둔다.

### health_records에 Soft Delete 적용

건강 기록은 AI 분석의 핵심 데이터다.

물리 삭제는 시계열 데이터의 연속성을 깨트린다.

### 나머지 도메인

병원 기록, 약 정보, 리포트는 사용자가 명시적으로 삭제 의사를 표현한 경우 즉시 삭제한다.

---

## 구현

```
pets 테이블: deleted_at TIMESTAMP NULL
health_records 테이블: deleted_at TIMESTAMP NULL
```

조회 시 `WHERE deleted_at IS NULL` 조건을 기본으로 적용한다.

---

## Trade-off

Soft Delete는 쿼리에 항상 `deleted_at IS NULL` 조건이 필요하다.

누락 시 삭제된 데이터가 노출된다.

NestJS에서는 TypeORM의 `@DeleteDateColumn()`을 활용하여 이를 자동화한다.

---

## Status

현재: pets, health_records에 Soft Delete 적용 예정
