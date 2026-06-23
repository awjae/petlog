---
description: Petlog AI 레이어 구현을 Claude API 기준으로 설계하거나 검토한다
---

작업 내용: $ARGUMENTS

Petlog의 AI 추상화 레이어와 Claude/OpenAI API 연동을 위한 설계 또는 검토를 수행한다.

---

## Petlog AI 레이어 구조

```
ReportService
  ↓
HealthReportGenerator (Interface)
  ├── MockHealthReportGenerator     ← 현재 사용
  └── LLMHealthReportGenerator      ← 향후 연동
```

인터페이스:
```typescript
interface HealthReportGenerator {
  generate(petId: string, period: ReportPeriod): Promise<ReportSummary>;
}
```

---

## LLM 연동 시 고려 사항

### 입력 데이터 구조 (AI가 소비할 형태)
```typescript
interface HealthAnalysisInput {
  period: { start: Date; end: Date };
  records: {
    weight: number[];
    appetite: ('good' | 'normal' | 'poor')[];
    activity: ('high' | 'normal' | 'low')[];
    symptoms: string[];
  };
  medicalEvents: { date: Date; description: string }[];
  medications: { name: string; dosage: string }[];
}
```

### 모델 선택 기준
- 초기: claude-haiku-4-5-20251001 (빠른 응답, 낮은 비용, 요약 생성 충분)
- 고품질 리포트: claude-sonnet-4-6 (복잡한 패턴 분석)
- Fine-tuned 모델: OpenAI GPT 기반 (반려동물 건강 도메인 특화)

### 비용 최적화
- 입력 토큰 최소화: 기간 내 데이터만 전달
- Prompt Caching: system prompt를 캐시하여 반복 비용 절감
- 응답 길이 제한: max_tokens 설정

### 에러 처리
- AI Provider 실패 시 MockHealthReportGenerator로 폴백
- Timeout: 30초 이상 시 재시도 또는 실패 처리
- 사용자에게: "리포트 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."

---

## 작업 종류에 따른 출력

**설계 요청 시:** LLMHealthReportGenerator 구현 코드 + Prompt 설계
**검토 요청 시:** 현재 구현에서 추상화 누수 또는 비용 낭비 지점 식별
