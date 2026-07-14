// TODO(다음 단계): Frontend Integration(@integration) — 홈 화면.
// 이번 작업 범위는 E2E(인증 흐름) 우선이라 실제 구현은 다음 단계로 미룬다.
// 네트워크는 MSW(frontend/src/mocks/handlers/home.ts)로 모킹하고, 인증 상태는
// e2e/fixtures/auth.ts의 authenticatedPage 픽스처(실제 백엔드에서 획득한 쿠키 재사용)로
// 준비한다. 실제 GraphQL 호출은 e2e/helpers/graphql.ts(TODO)를 통해 override한다.
//
// 커버 예정 시나리오:
// - happy path: 반려동물 카드 노출 (등록된 pet 1개 이상 + 최근 기록/스트릭 표시)
// - empty state: 반려동물 미등록 시 HomeNoPetContent 노출
// - error state: HOME_QUERY 실패 시 에러 UI + 재시도 버튼 동작
//
// 필요한 data-testid (현재 프론트 전체에 data-testid 0건 — 작성 전 컴포넌트에 추가 필요):
// - PetSelector 카드, TodayRecordBanner, HomeNoPetContent CTA 등

import { test } from '../fixtures/auth';

test.describe('홈 화면 @integration', () => {
  test.skip('TODO: happy path - 반려동물 카드 및 오늘 기록 배너 노출', async () => {});
  test.skip('TODO: empty state - 반려동물 미등록 시 등록 유도 화면 노출', async () => {});
  test.skip('TODO: error state - 데이터 로드 실패 시 에러 UI 및 재시도', async () => {});
});
