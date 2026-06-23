---
description: Frontend-Backend API 계약을 설계하거나 검증한다
---

대상 기능 또는 도메인: $ARGUMENTS

NestJS(Backend)와 Next.js(Frontend) 사이의 API 계약을 설계하거나 현재 구현이 계약을 따르는지 검증한다.

---

## API 계약 설계 (신규 기능)

다음을 정의한다:

### 엔드포인트 목록
```
GET    /api/pets/:id/health-records
POST   /api/pets/:id/health-records
GET    /api/pets/:id/health-records/:recordId
PUT    /api/pets/:id/health-records/:recordId
DELETE /api/pets/:id/health-records/:recordId
```

### 요청 DTO (Backend)
```typescript
class CreateHealthRecordDto {
  type: HealthRecordType;
  value: string;
  note?: string;
  recordedAt: Date;
}
```

### 응답 타입 (Frontend에서 사용할 타입)
```typescript
interface HealthRecord {
  id: string;
  petId: string;
  type: HealthRecordType;
  value: string;
  note?: string;
  recordedAt: string;
  createdAt: string;
}
```

### 에러 응답
```typescript
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
```

---

## API 계약 검증 (기존 구현)

현재 구현에서 다음을 확인한다:

1. Backend DTO와 Frontend 타입이 일치하는가?
2. 날짜 필드 직렬화 형식이 일관된가? (ISO 8601)
3. 에러 응답 형식이 통일되어 있는가?
4. 페이지네이션이 필요한 목록 API에 적용되어 있는가?
5. 인증 토큰 처리 방식이 일관된가?

---

## 출력 형식

```
## API 계약

### [도메인명] API

| Method | Path | 설명 |
|--------|------|------|
| GET    | ...  | ...  |

### Request DTO
...

### Response Type  
...

### 불일치 또는 개선 필요
- ...
```
