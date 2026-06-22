# Decision: AI 추상화 레이어 설계

## Context

Petlog는 반려동물 건강 데이터를 기반으로 AI 리포트를 생성하는 기능을 제공한다.

초기에는 실제 LLM API 연동 없이 개발을 진행해야 한다.

향후 실제 AI Provider 연동이 필요하다.

이 두 가지 요구사항을 동시에 만족하는 구조가 필요했다.

---

## Problem

AI 기능을 어떻게 설계할 것인가?

가능한 방향:

1. 처음부터 실제 LLM API 연동
2. 추상화 없이 Mock 코드 작성 후 나중에 교체
3. 인터페이스 기반 추상화 레이어 설계

---

## Decision

인터페이스 기반 추상화 레이어를 먼저 설계한다.

구조:

```
ReportService
  ↓
HealthReportGenerator (Interface)
  ├── MockHealthReportGenerator
  └── LLMHealthReportGenerator
```

---

## Reason

### Mock 개발 가능

초기에는 MockHealthReportGenerator를 사용하여 실제 AI 없이 개발을 진행할 수 있다.

### Provider 교체 가능

LLM Provider가 결정되면 LLMHealthReportGenerator만 추가하면 된다.

ReportService는 수정하지 않아도 된다.

### 테스트 가능

Mock 구현체를 통해 AI 응답을 제어하여 테스트할 수 있다.

### 비즈니스 로직 보호

ReportService가 특정 AI Provider에 직접 의존하지 않는다.

---

## Interface Design

```typescript
interface HealthReportGenerator {
  generate(petId: string, period: ReportPeriod): Promise<ReportSummary>;
}
```

---

## Trade-off

초기 설계에 시간이 더 소요된다.

하지만 이 구조가 없으면 LLM 교체 시 ReportService 전체를 수정해야 한다.

초기 복잡성보다 장기 유지보수 비용을 고려하여 추상화를 선택했다.

---

## Status

현재: MockHealthReportGenerator 사용

향후: LLMHealthReportGenerator 추가 예정
