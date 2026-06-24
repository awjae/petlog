# Decision: GraphQL (Schema-driven) + Prisma 도입

## Status

결정됨

---

## Context

Petlog는 복잡한 도메인 관계를 가진다.

```
Pet
├── HealthRecord (체중, 식욕, 활동량, 증상...)
├── MedicalEvent (병원 방문)
├── Medication (투약)
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

### GraphQL (Schema-driven) 채택

Code-first가 아닌 Schema-first를 선택한다.

이유:
- `.graphql` 파일이 API 계약의 단일 진실 공급원 역할
- Frontend와 Backend가 스키마를 기준으로 병렬 개발 가능
- 타입 자동 생성 (`graphql-codegen`)으로 FE 타입 별도 작성 불필요

건강 타임라인 쿼리 예시:

```graphql
query PetTimeline($petId: ID!, $from: DateTime!) {
  pet(id: $petId) {
    healthRecords(from: $from) { type value recordedAt }
    medicalEvents(from: $from) { hospitalName visitDate }
    medications { name endDate }
    latestReport { summary { overview } }
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
- Prisma Studio로 개발 중 DB 확인 가능

---

## Trade-off

### GraphQL

도입 비용:
- N+1 문제를 DataLoader로 반드시 해결해야 함
- 파일 업로드(MedicalEvent attachment)는 REST 엔드포인트를 별도 운영
- REST 대비 초기 설정 복잡도 높음

수용 이유:
- Petlog의 도메인 관계 복잡도가 GraphQL의 이점을 충분히 활용함
- 모바일 우선 서비스에서 불필요한 데이터 최소화가 실질적 이점

### Prisma

도입 비용:
- NestJS와 TypeORM의 통합 방식(데코레이터 기반 엔티티)을 사용할 수 없음
- Prisma Client 생성 단계가 빌드 파이프라인에 추가됨

수용 이유:
- TypeORM의 타입 불안전성보다 Prisma의 타입 안전성이 장기 유지보수에 유리
- `libs/types`의 도메인 타입과 Prisma 생성 타입을 함께 사용하여 일관성 유지

---

## 적용 범위

- 모든 도메인 API: GraphQL
- 파일 업로드: REST (`POST /api/upload`)
- 인증 엔드포인트: REST (`POST /api/auth/*`) — 쿠키 기반 인증과의 호환성
- 데이터 접근: 전체 Prisma 사용, TypeORM 제거
