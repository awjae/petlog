---
description: Petlog 기준으로 현재 변경사항을 코드 리뷰한다
---

$ARGUMENTS

현재 git diff 또는 지정된 파일을 Petlog 아키텍처 기준으로 리뷰한다.

---

## Petlog 코드 리뷰 기준

### 도메인 원칙
- Controller는 얇은가? (비즈니스 로직이 Service에 있는가?)
- Component는 얇은가? (API 호출이 Hook/API Layer에 위임되어 있는가?)
- 데이터 흐름: Component → Hook → API Layer → Backend 순서를 지키는가?

### AI 추상화
- ReportService가 AI Provider를 직접 의존하는가? (있으면 버그)
- HealthReportGenerator 인터페이스를 통해 호출하는가?

### TypeScript
- `any` 타입 사용 여부 (없어야 함)
- 도메인 타입 (HealthRecordType, ReportType 등) 대신 string literal을 사용하는가?

### 사용자 경험
- 비동기 상태 (Loading / Error / Empty) 처리가 모두 있는가?
- 모바일 기준 UI인가?

---

코드 리뷰 후 다음 형식으로 결과를 제공한다.

**버그 / 원칙 위반:**
- 파일경로:라인번호 → 문제 → 수정 방법

**개선 권장 (선택):**
- 파일경로:라인번호 → 이유

**이상 없음:**
- 확인된 항목 요약
