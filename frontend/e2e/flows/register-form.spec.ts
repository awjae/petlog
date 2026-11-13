// Frontend Integration(@integration) — 회원가입 폼: 비밀번호 확인 칸 없이 "보기" 토글로 확인.
// 확인 칸을 없앴으므로, 8자 미만 안내와 토글이 그 역할을 대신하는지 본다.

import { test, expect } from '@playwright/test';

test.describe('회원가입 폼 @integration', () => {
  test('비밀번호 보기 토글로 입력한 값을 확인할 수 있다', async ({ page }) => {
    await page.goto('/register');
    const password = page.getByLabel('비밀번호', { exact: true });
    await password.fill('password123');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: '비밀번호 보기' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: '비밀번호 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('8자 미만이면 안내하고 가입 버튼을 막는다', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('이메일').fill('a@petlog.test');
    await page.getByLabel('비밀번호', { exact: true }).fill('short');
    await page.locator('label[for="agree-all"]').click();

    await expect(page.getByText('8자 이상 입력해주세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeDisabled();

    await page.getByLabel('비밀번호', { exact: true }).fill('password123');
    await expect(page.getByRole('button', { name: '회원가입' })).toBeEnabled();
  });
});
