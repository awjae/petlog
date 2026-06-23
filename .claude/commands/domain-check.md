---
description: 도메인 경계와 아키텍처 원칙 준수 여부를 검사한다
---

다음 파일 또는 경로를 검사한다: $ARGUMENTS

Petlog 도메인 모델과 아키텍처 원칙에 따라 아래 항목을 검사하고, 위반 사항이 있으면 **파일 경로:라인번호** 형식으로 명시한다.

---

## 1. 도메인 경계 검사

**올바른 소유 구조:**
```
HealthRecord → Pet → User  (O)
HealthRecord → User         (X)
```

- HealthRecord, MedicalEvent, Medication, Report는 반드시 petId를 통해 Pet에 연결되는지 확인
- User를 직접 참조하는 건강 데이터 엔티티가 없는지 확인

## 2. 레이어 분리 검사

**Frontend:**
- React Component 내부에 직접 fetch/axios 호출이 있는지 확인 (있으면 위반)
- 비즈니스 로직이 Component에 있는지 확인 (있으면 위반)
- 데이터 흐름: Component → Hook → API Layer 순서를 따르는지 확인

**Backend:**
- Controller에 비즈니스 로직이 있는지 확인 (있으면 위반)
- Service에서 직접 Database 쿼리(raw SQL)를 작성하는지 확인

## 3. AI 추상화 검사

- ReportService가 AI Provider(OpenAI 등)를 직접 import하는지 확인 (있으면 위반)
- HealthReportGenerator 인터페이스를 통해서만 AI를 호출하는지 확인

## 4. TypeScript 규칙 검사

- `any` 타입 사용 여부 확인 (사용하면 위반)
- 도메인 타입/인터페이스 없이 raw object를 사용하는지 확인

---

## 결과 형식

위반 없음이면: "도메인 원칙 준수 확인 완료 ✓"

위반 있으면:
```
[위반 유형] 파일경로:라인번호
→ 문제: ...
→ 수정 방향: ...
```
