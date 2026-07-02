# Decision: 품종별 건강 리스크 — 파인튜닝이 아닌 정적 데이터 + 규칙 기반 후처리

## Status

결정됨 (`BreedProfileService`, `libs/ai/breed-profile.json`)

---

## Context

`002-ai-abstraction.md`에서 결정한 대로 리포트 생성은 파인튜닝된 모델(`ft:gpt-4o-mini-...:petlog:...`)을 사용한다.

리포트에 "품종별로 주의해야 할 질환"(예: 골든 리트리버는 고관절 이형성증 위험이 상대적으로 높음)과 "노령기 여부에 따른 권장 검진 주기" 같은 정보를 포함하고 싶었다.

---

## Problem

품종 기반 건강 지식을 리포트에 어떻게 반영할 것인가?

가능한 방향:

1. 파인튜닝 학습 데이터에 품종별 지식을 섞어 모델이 스스로 언급하게 한다
2. 프롬프트에 품종별 지식을 매번 텍스트로 주입한다
3. 품종별 지식을 별도 정적 데이터(JSON)로 관리하고, LLM 응답과 무관하게 규칙 기반으로 후처리 병합한다

---

## Decision

`libs/ai/breed-profile.json`에 품종별 `predisposed_conditions`(위험질환, risk_level, watch_for, age_onset_months)와 `life_stage_checks`(노령기 시작 개월 수, 권장 검진 주기)를 정적 데이터로 관리한다.

`BreedProfileService`가 `species/breed/birthDate`로 이 데이터를 조회해 `BreedAlert[]`와 `BreedLifeStageInfo`를 반환하고, `LlmReportGenerator.mergeBreedProfile()`이 LLM이 생성한 `overview/highlights/concerns/recommendations`에 규칙 기반으로 문구를 추가한다.

```
LLM 응답 (overview, highlights, concerns, recommendations)
        +
BreedProfileService 규칙 매칭 결과 (age_onset_months 도달 + risk_level)
        ↓
   후처리 병합된 최종 리포트
```

`risk_level: high`는 `concerns`에, `medium`은 `recommendations`에 배치한다. Mock 생성기(`mock-report.generator.ts`)와 LLM 생성기(`llm-report.generator.ts`) 양쪽에 동일한 병합 규칙을 적용한다.

---

## Reason

### 사실 정확성 보장 (Hallucination 방지)

품종별 위험질환은 "의학적 사실"에 가까운 정보다. LLM이 프롬프트만으로 이를 언급하게 하면 품종명을 잘못 매칭하거나 존재하지 않는 위험을 지어낼 수 있다. 정적 데이터 + 결정론적 매칭(나이 조건 `age_onset_months` 비교)은 항상 같은 입력에 같은 결과를 보장한다.

### 파인튜닝 재학습 비용 회피

품종 데이터셋(위험질환 목록, 권장 검진 주기)은 계속 보강될 수 있는 영역이다. 이 정보를 파인튜닝 데이터에 섞으면, 데이터 갱신 때마다 모델을 재학습해야 한다. JSON 파일 수정만으로 즉시 반영되는 구조가 훨씬 저렴하다.

### AI Independence 원칙 준수

`domain-model.md`의 "Report는 AI Provider와 직접 연결하지 않는다" 원칙에 따라, `BreedProfileService`는 AI 모듈 내부에 있지만 OpenAI/ChatGPT 클라이언트(`libs/ai/chatgpt`)와 완전히 독립적이다. LLM 클라이언트가 교체되어도 품종 지식 레이어는 영향받지 않는다.

### Mock/LLM 동일 규칙 재사용

Mock 개발 단계에서도 동일한 `BreedProfileService`를 통해 품종 정보가 포함된 리포트를 확인할 수 있어, `002`에서 강조한 "Mock → 실제 Provider 전환 시 비즈니스 로직 변경 없음" 원칙이 품종 지식 레이어에도 그대로 적용된다.

---

## Trade-off

- 프로필에 등록되지 않은 품종(또는 잡종/품종 미상)은 `getBreedAlerts`가 빈 배열을 반환한다 — 데이터 커버리지가 곧 기능 커버리지다. 품종 데이터셋 확장이 향후 백로그.
- 후처리 병합이라 LLM이 이미 비슷한 내용을 자연스럽게 언급했을 경우 문구가 중복될 수 있다. 현재는 이를 자동으로 감지해 제거하지 않는다.
