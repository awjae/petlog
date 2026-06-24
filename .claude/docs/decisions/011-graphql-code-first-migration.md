# Decision: Schema-first → Code-first 전환

## Status

결정됨 (2026-06-24)

---

## Context

초기 개발 시 Schema-first로 GraphQL을 구성했다.
backend-architect 코드 리뷰에서 구조적 문제가 발견되어 Code-first로 전환했다.

---

## Problem

Schema-first 운영 중 발생한 실제 문제들:

**1. 타입 이중 관리**

```
pet.graphql         → CreatePetInput (GraphQL 스키마)
pet.service.ts      → CreatePetInput (Service 인터페이스)
graphql.ts          → CreatePetInput (generate-typings 자동생성)
```

동일한 타입이 세 곳에 분산. 스키마 변경 시 세 곳을 동기화해야 함.

**2. Resolver의 `as never` 남용**

```typescript
// GraphQL Input과 Service Input 간 타입 연결 불가
createPet(@Args('input') input: Record<string, unknown>) {
  return this.petService.create(user.id, input as never);  // 타입 포기
}
```

GraphQL boundary에서 타입 안전성이 완전히 사라짐.

**3. Prisma enum과 GraphQL enum 충돌**

```typescript
// graphql.ts 자동생성 enum
enum Species { dog = "dog", cat = "cat" }  // TypeScript string enum

// Prisma 생성 타입
type Species = 'dog' | 'cat'  // string literal union
```

TypeScript 타입 시스템에서 호환 불가 → Service에서도 `as never` 캐스팅 필요.

---

## Decision

Code-first로 전환한다.

**핵심 구조 변경:**

| 항목 | Before | After |
|------|--------|-------|
| 타입 정의 | `.graphql` 파일 | `*.types.ts` 클래스 |
| 스키마 | 직접 작성 | 자동 생성 (`schema.generated.graphql`) |
| enum | GraphQL enum + Prisma enum 분리 | Prisma enum 단일 사용 (`registerEnumType`) |
| 검증 | 없음 (Apollo 스키마 타입만) | `class-validator` 데코레이터 |
| Resolver 파라미터 타입 | `Record<string, unknown>` | InputType 클래스 직접 사용 |

**파일 변화:**

삭제:
- `src/schema.graphql`
- `src/*/\*.graphql` (6개)
- `src/graphql.ts` (generate-typings 출력물)
- `src/generate-typings.ts`

추가:
- `src/pet/pet.types.ts`
- `src/health-record/health-record.types.ts`
- `src/medical-event/medical-event.types.ts`
- `src/medication/medication.types.ts`
- `src/vaccination/vaccination.types.ts`
- `src/appointment/appointment.types.ts`

**결과:**

```typescript
// types 파일 하나로 전체 타입 체인 연결
@InputType()
export class CreatePetInput {
  @Field(() => Species)   // GraphQL 필드 정의
  @IsEnum(Species)        // 입력 검증
  species!: Species;      // Prisma enum 직접 사용 → 서비스에서 캐스팅 불필요
}

// Resolver: 타입 명시, as never 없음
createPet(@Args('input') input: CreatePetInput) {
  return this.petService.create(user.id, input);
}

// Service: 동일 타입 사용, 타입 체인 완성
async create(userId: string, input: CreatePetInput) {
  await this.prisma.pet.create({ data: { ...input, userId } });
}
```

---

## Trade-off

포기한 것:
- SDL 명시성 — `.graphql` 파일이 더 읽기 쉬운 API 계약 역할을 했음
- Frontend 팀이 스키마를 먼저 보고 개발하는 Schema-first 워크플로우

얻은 것:
- 타입 단일화 (세 곳 → 한 곳)
- Prisma enum 충돌 완전 해소
- `class-validator` 통합으로 입력 검증 강화
- `as never` 캐스팅 제거

포트폴리오 관점에서 이 전환 자체가 "실제 개발 중 발생한 구조 문제를 인식하고 개선한 의사결정"으로 활용 가능하다.
