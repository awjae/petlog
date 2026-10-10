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

import { test, expect } from '../fixtures/auth';

test.describe('건강 기록 @integration', () => {
  test.skip('TODO: happy path - FAB로 기록 추가 후 저장 완료', async () => {});
  test.skip('TODO: happy path - 타임라인 날짜별 목록 및 필터 동작', async () => {});
  test.skip('TODO: empty state - 해당 날짜에 기록 없음', async () => {});
  test.skip('TODO: error state - 저장 API 실패 시 에러 메시지 노출', async () => {});
});

// Frontend Integration(@integration) — 기록 폼의 반려동물 선택이 홈과 어긋나지 않는지.
//
// 기록 폼은 pet을 두 경로로 정한다: URL의 ?petId=(홈·상세·시트에서 진입)와 폼 안의
// 반려동물 버튼. 둘 다 selectedPet 스토어에 반영돼야 하는데(스토어 주석 참고), URL쪽
// 반영을 "스토어와 다르면 덮어쓴다"로 구현하면 폼에서 바꾼 선택이 URL 값으로 되돌아간다.
// 그러면 사용자는 뭉치에 기록하고 홈에서는 초코를 보게 된다 — 화면은 둘 다 멀쩡해서
// 타입체크나 단위 테스트로는 걸리지 않는다.
//
// stub을 쓰지 않는다. 목업 데이터(src/mocks/data/home.ts)에 pet이 2마리라 반려동물
// 선택 버튼이 실제로 그려지는 상태가 그대로 필요하다.
test.describe('기록 폼 반려동물 선택 @integration @mock', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('URL로 지정한 반려동물이 홈의 선택에도 반영된다', async ({ page }) => {
    // 반려동물 등록 직후 이 화면으로 바로 오는 경로(pets/new → records/new?petId=)가
    // 기대하는 동작이다. 스토어가 비어 있으면 홈은 pets[0](초코)로 떨어진다.
    await page.goto('/records/new?petId=pet-2');
    await expect(page.getByRole('button', { name: '뭉치' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.goto('/home');
    await expect(page.getByRole('button', { name: /선택된 반려동물: 뭉치/ })).toBeVisible();
  });

  test('폼에서 반려동물을 바꾸면 홈의 선택도 따라간다', async ({ page }) => {
    await page.goto('/records/new?petId=pet-1');

    await page.getByRole('button', { name: '뭉치' }).click();
    await expect(page.getByRole('button', { name: '뭉치' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.goto('/home');
    await expect(page.getByRole('button', { name: /선택된 반려동물: 뭉치/ })).toBeVisible();
  });
});
