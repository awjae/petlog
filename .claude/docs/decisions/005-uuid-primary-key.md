# Decision: UUID를 Primary Key로 사용

## Context

데이터베이스 Primary Key 전략을 결정해야 한다.

---

## Problem

어떤 ID 전략을 사용할 것인가?

가능한 방향:

1. Auto-increment Integer (1, 2, 3...)
2. UUID v4 (랜덤)
3. UUID v7 (시간 정렬 가능)
4. ULID

---

## Decision

UUID v4를 Primary Key로 사용한다.

---

## Reason

### 보안

Auto-increment는 URL에 노출 시 레코드 수 추측이 가능하다.

`/pets/1`, `/pets/2` 형태는 전체 데이터 수와 순서를 노출한다.

### 분산 환경 대비

향후 데이터 마이그레이션, 멀티 인스턴스 환경에서 ID 충돌이 없다.

### 프론트엔드 생성 가능

클라이언트에서 ID를 사전 생성하여 Optimistic Update를 구현할 수 있다.

---

## Trade-off

### 단점

- Index 크기가 Integer보다 크다
- 삽입 순서와 물리적 저장 순서가 다를 수 있다 (페이지 분열)

### 대응

초기 데이터 규모에서 성능 차이는 미미하다.

향후 성능 문제가 측정되면 UUID v7 또는 ULID로 전환을 검토한다.

---

## Status

현재: UUID v4 사용
향후: 성능 측정 후 UUID v7 전환 검토
