// Frontend Integration(@integration) — 공개 계산 도구가 비로그인 상태에서 동작하는지.
// 계산식은 단위 테스트(petAge.test.ts)가 맡고, 여기서는 입력 → 결과 표시 배선만 본다.

import { test, expect } from '@playwright/test';

test.describe('계산 도구 @integration', () => {
  test('나이 계산기: 종류와 나이를 넣으면 사람 나이를 보여준다', async ({ page }) => {
    await page.goto('/tools/pet-age');

    await page.getByRole('radio', { name: /대형견/ }).click();
    await page.getByLabel('나이 (살)').fill('10');

    await expect(page.getByText('80살')).toBeVisible();
  });

  test('허브에서 도구로 들어갈 수 있다', async ({ page }) => {
    await page.goto('/tools');
    await page.getByRole('link', { name: /나이 계산기/ }).click();
    await expect(page).toHaveURL(/\/tools\/pet-age$/);
  });
});
