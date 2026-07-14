// TODO(다음 단계): Frontend Integration(@integration) — AI 리포트.
// 이번 작업 범위는 E2E(인증 흐름) 우선이라 실제 구현은 다음 단계로 미룬다.
//
// 커버 예정 시나리오:
// - happy path: 기간 선택(reportPeriod.ts 프리셋) → 생성 요청 → 로딩 → 결과 노출
// - empty state: 최소 기록 수/일수 미충족 시 생성 불가 안내
//   (backend/src/report/report.service.ts MIN_RECORD_COUNT=10, MIN_RECORD_DAYS=7와 대응)
// - error state: 생성 실패(failed) 상태 노출 및 재시도 導線
//
// 필요한 data-testid:
// - 기간 선택 바텀시트 프리셋 버튼, 생성 버튼, 로딩 스피너, 리포트 결과 섹션

import { test } from '../fixtures/auth';

test.describe('AI 리포트 @integration', () => {
  test.skip('TODO: happy path - 기간 선택 후 생성 → 로딩 → 결과 노출', async () => {});
  test.skip('TODO: empty state - 최소 기록 조건 미충족 시 생성 불가 안내', async () => {});
  test.skip('TODO: error state - 생성 실패 시 에러 상태 노출', async () => {});
});
