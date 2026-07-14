// TODO(다음 단계): Frontend Integration(@integration) — 건강 기록 + 타임라인.
// 이번 작업 범위는 E2E(인증 흐름) 우선이라 실제 구현은 다음 단계로 미룬다.
//
// 커버 예정 시나리오:
// - happy path: FAB → 기록 타입 선택 → 값 입력 → 저장 (3탭 이내로 완료돼야 함)
// - happy path: 타임라인에서 날짜별 기록 목록 노출 + 타입 필터 동작
// - empty state: 해당 날짜에 기록이 없을 때 빈 상태 UI
// - error state: 저장 API 실패 시 에러 메시지 노출
//
// 참고(backend/src/health-record/health-record.service.ts의 validateValue와 대응):
// weight/appetite/mood/activity/symptom/stool/vomit 7종 타입별로 필수 입력값이
// 다르므로, 최소 2~3종(weight, symptom 등 필수값이 여러 개인 타입 포함)은
// 프론트 폼 검증이 백엔드 정책과 어긋나지 않는지 함께 확인한다.
//
// 필요한 data-testid:
// - FAB 버튼, 기록 타입 선택 카드, 기록 저장 폼의 각 입력, 타임라인 필터 탭

import { test } from '../fixtures/auth';

test.describe('건강 기록 @integration', () => {
  test.skip('TODO: happy path - FAB로 기록 추가 후 저장 완료', async () => {});
  test.skip('TODO: happy path - 타임라인 날짜별 목록 및 필터 동작', async () => {});
  test.skip('TODO: empty state - 해당 날짜에 기록 없음', async () => {});
  test.skip('TODO: error state - 저장 API 실패 시 에러 메시지 노출', async () => {});
});
