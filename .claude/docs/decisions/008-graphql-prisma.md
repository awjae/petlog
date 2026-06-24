# Decision: GraphQL (Code-first) + Prisma 도입

## Status

결정됨 (2026-06-24 Schema-first → Code-first 전환)

---

## Context

Petlog는 복잡한 도메인 관계를 가진다.

```
Pet
├── HealthRecord (체중, 식욕, 활동량, 증상...)
├── MedicalEvent (병원 방문)
├── Medication (투약)
├── Vaccination (예방접종)
├── Appointment (병원 예약)
└── Report (AI 리포트)
```

API 레이어와 데이터 접근 레이어 선택지를 검토했다.

---

## Problem

### API 레이어

건강 타임라인 화면은 한 반려동물의 HealthRecord + MedicalEvent + Medication을 동시에 보여줘야 한다.

REST로 구현하면:

```
GET /pets/:id/health-records
GET /pets/:id/medical-events
GET /pets/:id/medications
```

모바일에서 3번의 요청이 발생하고, 각 응답에 불필요한 필드가 포함된다.

### 데이터 접근 레이어

TypeORM은 타입 안전성이 불완전하다. 엔티티 정의와 실제 DB 스키마가 불일치해도 컴파일 시점에 잡히지 않는다.

---

## Decision

### GraphQL Code-first 채택

초기에 Schema-first로 시작했으나 개발 중 Code-first로 전환했다.

**전환 이유:**

Schema-first 운영 시 발생한 문제:
- `.graphql` 파일의 Input 타입과 Service 인터페이스가 이중으로 관리됨
- GraphQL enum과 Prisma enum이 구조상 동일하나 TypeScript 타입 시스템에서 충돌 → `as never` 캐스팅 남발
- `generate-typings`로 생성한 `graphql.ts`와 서비스 인터페이스 간 동기화 부담

Code-first 선택 후:

```typescript
// *.types.ts 하나로 GraphQL 타입 + 서비스 DTO + 검증 통합
@InputType()
export class CreatePetInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Species)   // Prisma enum 직접 사용 → 캐스팅 불필요
  @IsEnum(Species)
  species!: Species;
}
```

- TypeScript 클래스 하나가 GraphQL 타입 + Service DTO + 검증 규칙을 모두 담음
- Prisma enum을 `registerEnumType`으로 직접 등록 → enum 타입 충돌 완전 해소
- `schema.generated.graphql`은 빌드 시 자동 생성 (수동 관리 불필요)
- `class-validator`와 `ValidationPipe` 통합으로 입력 검증 일원화

건강 타임라인 쿼리 예시:

```graphql
query PetTimeline($petId: ID!, $from: DateTime!) {
  pet(id: $petId) {
    healthRecords { type numValue textValue recordedAt }
    medicalEvents { hospitalName visitDate }
    medications { name endDate }
  }
}
```

1번 요청으로 화면에 필요한 모든 데이터를 조회한다.

### Prisma 채택

TypeORM 대신 Prisma를 사용한다.

이유:
- `schema.prisma`가 도메인 모델의 단일 진실 공급원 역할 (DB 스키마 + 타입 동시 정의)
- 쿼리 결과 타입이 자동 생성되어 런타임 타입 불일치 없음
- `prisma migrate dev` 하나로 마이그레이션 관리
- Prisma enum을 GraphQL InputType에 직접 사용 → 타입 체인 완전 연결

---

## Trade-off

### GraphQL Code-first

도입 비용:
- N+1 문제를 DataLoader로 반드시 해결해야 함 (프론트 연동 전 처리 예정)
- 파일 업로드(MedicalEvent attachment)는 REST 엔드포인트를 별도 운영
- Schema-first 대비 SDL이 명시적이지 않음 (대신 `schema.generated.graphql` 참조)

수용 이유:
- 타입 단일화로 유지보수 비용 감소가 SDL 명시성 손실보다 큼
- Prisma enum과의 통합이 자연스러워 캐스팅 없는 타입 체인 구성 가능

### Prisma

도입 비용:
- NestJS와 TypeORM의 통합 방식(데코레이터 기반 엔티티)을 사용할 수 없음
- Prisma Client 생성 단계가 빌드 파이프라인에 추가됨

수용 이유:
- TypeORM의 타입 불안전성보다 Prisma의 타입 안전성이 장기 유지보수에 유리

---

## 적용 범위

- 모든 도메인 API: GraphQL (Code-first)
- 파일 업로드: REST (`POST /api/upload`)
- 인증 엔드포인트: REST (`POST /api/auth/*`) — 쿠키 기반 인증과의 호환성
- 데이터 접근: 전체 Prisma 사용, TypeORM 제거
