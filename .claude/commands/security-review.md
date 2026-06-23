---
description: Petlog 보안 관점에서 인증/데이터 접근을 검사한다
---

검사 대상: $ARGUMENTS

Petlog는 사용자의 반려동물 건강 데이터(민감 정보)를 다루는 서비스다.
아래 보안 항목을 우선 검사한다.

---

## 1. 인증 / 인가

- API 엔드포인트에 JWT Guard가 적용되어 있는가?
- 사용자가 **본인 Pet의 데이터만** 접근할 수 있는가?
  ```
  // 위험: petId만 검증
  GET /pets/:petId/health-records

  // 안전: petId + 소유자 검증
  if (pet.userId !== currentUser.id) throw ForbiddenException
  ```
- Report 생성 API에 소유권 검증이 있는가?

## 2. 입력 검증

- NestJS DTO에 `class-validator` 데코레이터가 적용되어 있는가?
- SQL Injection 가능성: raw query 사용 여부 (TypeORM/Prisma ORM 사용을 권장)
- 파일 업로드(MedicalEvent attachment)에 파일 타입 / 크기 제한이 있는가?

## 3. 민감 데이터 노출

- API 응답에 불필요한 필드(password hash, 내부 ID 등)가 포함되는가?
- 에러 메시지에 DB 구조나 내부 정보가 노출되는가?
- 환경 변수(DB 비밀번호, JWT Secret, AI API Key)가 코드에 하드코딩되어 있는가?

## 4. 유료 기능 보호

- AI Report 생성 API가 인증 없이 호출 가능한가?
- 향후 결제 연동 시 서버 사이드 검증이 가능한 구조인가?

---

## 출력 형식

**Critical (즉시 수정 필요):**
- 파일경로:라인번호 → 취약점 → 수정 방법

**Warning (수정 권장):**
- 파일경로:라인번호 → 이유

**Pass:**
- 검증 완료 항목
