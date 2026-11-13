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

  test('칼로리 계산기: 체중과 사료 칼로리로 하루 급여량을 보여준다', async ({ page }) => {
    await page.goto('/tools/daily-calories');

    await page.getByRole('radio', { name: '성견 · 중성화', exact: true }).click();
    await page.getByLabel('체중 (kg)').fill('10');
    await expect(page.getByText('약 630kcal')).toBeVisible();

    await page.getByLabel('사료 칼로리 (kcal/kg)').fill('3500');
    await expect(page.getByText(/사료로 하루 약 180g/)).toBeVisible();
  });

  test('음수량 계산기: 고양이는 개보다 낮은 기준으로 판정한다', async ({ page }) => {
    await page.goto('/tools/water-intake');
    await page.getByLabel('체중 (kg)').fill('4');
    await page.getByLabel('마신 양 (mL)').fill('300');
    await expect(page.getByText(/1kg당 75mL — 많이 마시는 기준 아래예요/)).toBeVisible();

    await page.getByRole('radio', { name: '고양이' }).click();
    await expect(page.getByText('160~200mL')).toBeVisible();
    await expect(page.getByText(/1kg당 75mL — 기준보다 많아요/)).toBeVisible();
  });

  test('허브에서 도구로 들어갈 수 있다', async ({ page }) => {
    await page.goto('/tools');
    await page.getByRole('link', { name: /나이 계산기/ }).click();
    await expect(page).toHaveURL(/\/tools\/pet-age$/);
  });
});
