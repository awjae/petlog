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

`medical_events`, `medications`, `vaccinations`, `appointments`, `reports`는 Hard Delete를 허용한다.

---

## Reason

### pets에 Soft Delete 적용

반려동물을 삭제해도 연결된 건강 기록이 데이터 분석에 필요할 수 있다.

보호자가 실수로 삭제한 경우 복구 가능성을 열어둔다.

### health_records에 Soft Delete 적용

건강 기록은 AI 분석의 핵심 데이터다.

물리 삭제는 시계열 데이터의 연속성을 깨트린다.

### 나머지 도메인

병원 기록, 약 정보, 백신 기록, 예약, 리포트는 사용자가 명시적으로 삭제 의사를 표현한 경우 즉시 삭제한다.

---

## 구현

```
pets 테이블:           deleted_at TIMESTAMP NULL
health_records 테이블: deleted_at TIMESTAMP NULL
```

### Prisma $extends 방식 (Prisma 6)

Prisma 5까지는 `$use` middleware로 전역 필터를 적용할 수 있었다.
Prisma 6에서 `$use`가 제거되어 `Prisma.defineExtension`의 `query` 컴포넌트로 전환했다.

```typescript
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    pet: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // findUnique, findUniqueOrThrow, findFirst, findFirstOrThrow, count, aggregate 모두 처리
    },
    healthRecord: { /* 동일 */ },
  },
});
```

PrismaService는 `extends PrismaClient` 대신 내부적으로 확장된 클라이언트를 wrapping하고,
각 모델을 getter로 위임한다. 사용처에서 `prisma.pet.findMany()` 형태를 그대로 유지한다.

### findUnique 처리

`findUnique`의 TypeScript where 타입은 unique 필드만 허용한다.
`deletedAt`은 unique 제약이 없으므로 타입 단언(type assertion)으로 처리한다.

```typescript
async findUnique({ args, query }) {
  return query({
    ...args,
    where: { ...args.where, deletedAt: null } as typeof args.where,
  });
},
```

런타임에서 Prisma는 추가 조건을 SQL WHERE절에 포함시켜 처리한다.

### 삭제 실행

서비스 레이어에서 직접 update를 호출한다.

```typescript
await this.prisma.pet.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

---

## Trade-off

### Soft Delete 적용 범위 제한의 이유

모든 도메인에 Soft Delete를 적용하면 모든 쿼리에 필터가 필요해진다.
AI 분석에 영향 없는 도메인은 Hard Delete를 허용해 복잡도를 낮춘다.

### Cascade와 Soft Delete 공존

`onDelete: Cascade`는 물리적 DELETE 시에만 작동한다.
Soft Delete는 UPDATE이므로 Pet을 소프트 삭제해도 HealthRecord가 cascade 삭제되지 않는다.
연결 데이터가 보존되는 것이 의도된 동작이다.

---

## Status

Prisma 6 `$extends` 방식으로 구현 완료.
pets, health_records에 deletedAt 컬럼 및 자동 필터 적용.
