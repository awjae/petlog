import { test, expect } from '@playwright/test';

// @e2e — 신규 가입자가 첫 기록을 남기기까지의 전체 흐름.
//
// 화면별 테스트는 각 화면이 혼자 동작하는지만 본다. 여기서 지키는 것은 화면 사이의
// 연결이다: 가입 → 반려동물 등록 → 첫 기록 저장 → 홈에 반영. 이 중 한 곳이라도
// 끊기면 신규 가입자는 기록 없이 이탈한다(2026-09 가입자가 반려동물 등록 후 기록 없이
// 떠난 지점이 바로 이 연결 구간이다).
//
// 실제 백엔드 + DB가 필요하다. 계정 전략은 auth.spec.ts와 같다 — 시나리오마다 새 계정을
// 만들고 끝나면 탈퇴로 정리한다.
const TEST_PASSWORD = 'e2e-test-password-1234';

test.describe('첫 기록 흐름 @e2e', () => {
  test('가입 → 반려동물 등록 → 바로 첫 체중 기록 → 홈에 반영', async ({ page }) => {
    const email = `e2e+first-record-${Date.now()}-${Math.floor(Math.random() * 1e6)}@petlog.test`;

    await page.goto('/register');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
    await page.getByLabel('전체 동의').check();
    await page.getByRole('button', { name: '회원가입' }).click();

    await page.waitForURL('**/home');
    await page.getByRole('button', { name: '온보딩 닫기' }).click();
    await page.getByRole('link', { name: '반려동물 등록하기' }).click();

    // 이름만 필수다(PetForm의 isValid). 나머지는 신규 사용자가 건너뛸 수 있어야 한다.
    await page.waitForURL('**/pets/new');
    await page.getByLabel('이름', { exact: false }).fill('초코');
    await page.getByRole('button', { name: '등록하기' }).click();

    // 등록 직후 홈을 거치지 않고 기록 화면으로 바로 이어져야 한다.
    await page.waitForURL('**/records/new?petId=*');
    await page.getByLabel('체중 (kg)').fill('4.2');
    await page.getByRole('button', { name: '저장하기' }).click();
    await expect(page.getByRole('status').filter({ hasText: '기록했어요!' })).toBeVisible();

    // 저장 후 router.back()으로 홈에 돌아오고, 방금 남긴 기록이 보여야 한다.
    await page.waitForURL('**/home');
    await expect(page.getByRole('region', { name: '최근 건강 기록' })).toContainText('4.2');

    await page.context().request.post('/api/auth/withdraw', {
      data: { password: TEST_PASSWORD },
    });
  });
});
