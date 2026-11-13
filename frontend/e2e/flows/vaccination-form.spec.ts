// Frontend Integration(@integration) — 접종 기록은 백신을 골라야 저장할 수 있다.
//
// 서버는 백신 이름을 필수로 받는다. 화면이 "(선택)"으로 두고 저장을 허용하면 비워둔 채 누를
// 때마다 서버가 거절하고 사용자는 "다시 시도해주세요"만 본다(QA에서 실제로 재현됨).

import { test, expect } from '@playwright/test';

test.describe('접종 기록 폼 @integration @mock', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('백신을 고르기 전에는 저장할 수 없고, 고르면 저장할 수 있다', async ({ page }) => {
    await page.goto('/pets/pet-1/medical/vaccinations/new');
    const save = page.getByRole('button', { name: /저장하기/ });
    await expect(save).toBeDisabled();

    await page.getByRole('button', { name: '백신 선택' }).click();
    await page.getByRole('option').first().click();
    await expect(save).toBeEnabled();
  });

  test('"기타"를 고르면 이름을 입력해야 저장할 수 있다', async ({ page }) => {
    await page.goto('/pets/pet-1/medical/vaccinations/new');
    const save = page.getByRole('button', { name: /저장하기/ });

    await page.getByRole('button', { name: '백신 선택' }).click();
    await page.getByRole('option', { name: /기타/ }).click();
    await expect(save).toBeDisabled();

    await page.getByLabel('백신 이름 직접 입력').fill('켄넬코프');
    await expect(save).toBeEnabled();
  });
});
