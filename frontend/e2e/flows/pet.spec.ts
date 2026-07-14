// TODO(다음 단계): Frontend Integration(@integration) — 반려동물 등록.
// 이번 작업 범위는 E2E(인증 흐름) 우선이라 실제 구현은 다음 단계로 미룬다.
//
// 커버 예정 시나리오:
// - happy path: 폼 입력(이름/종/생일/성별 등) → 등록 완료 → 홈에서 카드 노출
// - empty state: (해당 없음 — pet.spec.ts는 등록 폼 자체의 흐름 검증)
// - error state: 등록 API 실패 시 에러 메시지 노출, 입력값 보존
//
// 필요한 data-testid:
// - pets/new 폼의 이름/종/생일/성별 입력, 프로필 사진 업로드, 제출 버튼

import { test } from '../fixtures/auth';

test.describe('반려동물 등록 @integration', () => {
  test.skip('TODO: happy path - 폼 입력 후 등록 완료 시 홈에서 카드 노출', async () => {});
  test.skip('TODO: error state - 등록 API 실패 시 에러 메시지 노출', async () => {});
});
