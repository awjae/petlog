# Decision: AI 리포트 신뢰 UX — 프론트엔드 범위로 한정한 실패 처리·재시도 설계

## Status

결정됨 (2026-07-23)

---

## Context

Petlog의 AI 건강 리포트는 Product Positioning상 "의료 진단이 아니다, 보호자의 의사결정을 지원한다"로 명시돼 있다. 그런데 리포트를 만드는 `HealthReportGenerator` 인터페이스(`ReportContent = { overview, highlights[], concerns[], recommendations[] }`)는 순수 텍스트 배열만 반환하고, 어떤 건강 기록을 근거로 그 문장이 나왔는지 추적할 방법이 없다. 실패 처리도 `ReportStatusNotice`가 "다시 시도해주세요" 고정 문구만 보여줄 뿐 실제 재시도 버튼이 없었고, 실패 사유(`failedReason`)는 DB에 저장은 되지만 어디에도 노출되지 않았다.

AI 에이전트가 업무/제품 전반에 확산되는 흐름에서, "AI 결과물을 사용자가 신뢰할 수 있게 만드는 UX"는 프론트엔드 고유의 역량 영역이 되고 있다고 판단해, Petlog AI 리포트에 실제로 적용해보기로 했다.

---

## Problem

신뢰 UX를 어느 범위까지, 어떤 순서로 구현할 것인가.

검토한 선택지:

1. **근거 추적(문장 단위 citation)까지 포함** — `ReportContent`를 `{ text, sourceRecordIds }[]` 구조로 확장하고, LLM에 structured output으로 근거 기록 id를 요청. 가장 완결적이지만 Prisma 스키마 변경, LLM 프롬프트 재설계, hallucination 검증이 선행돼야 해 공수가 크다.
2. **데이터 충분도 기반 신뢰도 배지** — LLM의 자기 확신도가 아니라 서버가 계산한 객관적 지표(기록 건수, 직전 리포트 대비 데이터량)를 노출. 이것도 백엔드 필드 추가가 필요하다.
3. **프론트엔드만으로 가능한 범위로 축소** — 새로 만들지 않고, 서버가 이미 계산·저장해뒀는데 프론트가 버리고 있던 정보(에러 코드, 실패 사유, 월 생성 제한 예외 로직)부터 정리한다.

---

## Decision

3번을 선택해 다음을 구현했다.

### 1. 실패 후 재시도가 월 1회 생성 제한을 소모하는지 먼저 확인

`report.service.ts`의 게이팅 쿼리(`generateReport`, `getReportStatus`)가 이미 `status: { not: ReportStatus.failed }`로 실패 리포트를 제외하고 있었다(`014-report-generation-policy.md`에서 도입). 즉 **"재시도는 월 1회 제한에 안 걸려야 한다"는 정책은 이미 존재**했고, 코드 변경이 필요했던 건 이 정책을 실제로 쓸 수 있게 해주는 재시도 버튼 자체였다.

### 2. 실패 상태에 재시도 버튼 추가 + 진행 상태 실시간 갱신

- `ReportStatusNotice`에 `onRetry`/`retrying` prop을 추가해 실패 시 "다시 만들기" primary 버튼을 노출한다.
- 상세 페이지(`/reports/[reportId]`)는 원래 `pending`/`processing` 상태를 한 번만 조회하고 멈춰 있어, 완성 여부를 보려면 사용자가 뒤로 갔다 다시 들어와야 했다. 목록 페이지(`/reports`)에만 연결돼 있던 `useReportPolling` 훅을 상세 페이지에도 붙여 3초 간격으로 자동 갱신되게 했다.

### 3. 실패 사유를 두 채널로 구분해서 노출

리포트 실패는 코드상 서로 다른 두 경로에서 발생한다.

- **동기 실패** (뮤테이션 자체가 즉시 거부, Report row가 생성되지도 않음): 기록 부족(`UNPROCESSABLE_ENTITY`), 이번 달 리포트 이미 존재(`CONFLICT`), 기간 오류(`BAD_REQUEST`). 서버는 이미 `extensions.code`와 함께 사용자용 한글 메시지를 던지고 있었는데, `useGenerateReport.ts`가 `onError: () => setError('리포트 생성에 실패했어요...')`로 그 정보를 버리고 고정 문구로 덮어쓰고 있었다.
- **비동기 실패** (`Report.status = 'failed'`, AI 생성 자체가 실패): `failedReason`이 임의 예외의 `err.message`를 그대로 담는 신뢰할 수 없는 문자열이라, "시간 초과" 여부만 안전하게 구분하고 나머지는 일반 오류 문구로 뭉뚱그렸다.

신규 파일 `report.errors.ts`(기존 `pet.errors.ts`와 동일한 화이트리스트 패턴)로 동기 실패의 알려진 3개 코드만 서버 메시지를 그대로 노출하고, `reportFormat.ts`의 `categorizeFailureReason()`으로 비동기 실패를 분류했다.

---

## Reason

### 새로 만들기보다 "이미 있는데 못 쓰고 있던 정보"부터

근거 추적(citation)처럼 처음부터 새로 설계해야 하는 기능과, 서버가 이미 계산·저장해뒀는데 프론트가 버리고 있던 정보(`extensions.code`, `failedReason`, 월 제한 예외 로직)는 ROI가 다르다. 후자부터 정리하는 것이 리스크 없이 신뢰 UX를 개선하는 첫 단계라고 판단했다.

### 화이트리스트 방식으로만 서버 에러 메시지를 노출

`extractGenerateReportErrorMessage`가 알려진 3개 코드일 때만 서버 메시지를 그대로 보여주고 나머지는 일반 문구로 폴백하는 이유는, 블랙리스트 방식(특정 패턴만 걸러내고 나머지는 통과)으로 하면 예상하지 못한 예외 메시지(내부 식별자, 스택 흔적 등)가 그대로 사용자에게 노출될 위험이 있기 때문이다.

### Product Positioning과의 연결

"의료 진단이 아니다, 의사결정을 지원한다"는 포지셔닝은 실패했을 때도 지켜야 한다. 실패를 숨기거나 뭉개지 않고 "무엇 때문에 실패했고 다음에 뭘 하면 되는지"를 알려주는 것 자체가 신뢰 UX의 일부라고 봤다(`architecture.md` Error Handling 원칙).

---

## Trade-off

- **근거 추적(citation)은 구현하지 않았다.** "이 문장은 어떤 기록에서 나왔는가"는 여전히 검증 불가능하다. `ReportContent` 스키마 확장 없이는 다음 단계로 넘어갈 수 없어, 별도 결정으로 분리해뒀다.
- **AI 생성 자체의 실패 사유는 여전히 "시간 초과 / 일반 오류" 2종뿐이다.** LLM API 오류, 네트워크 오류 등을 구조적으로 더 세분화하려면 백엔드 `runGeneration()`의 catch 블록에서 예외 타입을 분류해 저장해야 하는데, 이번엔 프론트엔드 범위로 한정했다.
- 상세 페이지에 폴링을 새로 붙이면서, 목록 페이지에서 생성 직후 바로 상세로 들어가는 경우 두 폴링이 동시에 돌아 요청이 중복될 수 있다. 현재 트래픽 규모(개인 프로젝트)에서는 무시 가능한 수준으로 판단해 별도 처리하지 않았다.
- 재시도할 때마다 실패한 `Report` row가 DB에 계속 쌓인다. 사용자 노출 목록(`findAll`)은 `completed`만 조회해 영향 없지만, 장기적으로 정리·보관 정책이 필요할 수 있다.
