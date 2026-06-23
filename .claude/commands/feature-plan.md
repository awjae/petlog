---
description: 새 기능을 Petlog 아키텍처에 맞게 계획한다
---

구현할 기능: $ARGUMENTS

Petlog의 도메인 모델과 아키텍처 원칙을 기반으로 구현 계획을 수립한다.

---

## 계획 수립 기준

1. **도메인 소속 판단**
   - 이 기능이 속하는 도메인은 무엇인가? (User / Pet / HealthRecord / MedicalEvent / Medication / Report)
   - 새로운 도메인이 필요한가, 기존 도메인의 책임 확장인가?

2. **데이터 모델**
   - 새로운 필드 또는 테이블이 필요한가?
   - 기존 도메인과의 관계 (1:N, N:M 등)
   - AI가 이 데이터를 소비할 가능성이 있는가? (있다면 구조화된 형태로 설계)

3. **Backend 구현 범위**
   - 추가할 NestJS 모듈/컨트롤러/서비스
   - API 엔드포인트 설계 (RESTful)
   - 필요한 DTO 및 Validation

4. **Frontend 구현 범위**
   - 추가할 feature 디렉토리 구조
   - 필요한 컴포넌트 (UI 책임만)
   - 필요한 Hook (데이터 조회 및 상태 연결)
   - API Layer 함수

5. **AI 레이어 영향**
   - 이 기능이 AI 리포트 생성에 영향을 주는가?
   - HealthReportGenerator 인터페이스 변경이 필요한가?

6. **구현 순서**
   1. DB 스키마
   2. Backend (Controller → Service → Repository)
   3. Frontend (API Layer → Hook → Component)

---

## 출력 형식

```
## 도메인 소속
...

## 데이터 모델 변경
...

## Backend 구현 목록
- [ ] ...

## Frontend 구현 목록
- [ ] ...

## 주의사항 / 트레이드오프
...
```
