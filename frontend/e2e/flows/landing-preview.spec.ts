// Frontend Integration(@integration) — 랜딩 미리보기 이미지가 실제로 로드되는지.
// public/landing의 파일명이 바뀌거나 빠지면 깨진 이미지 아이콘만 남고 테스트는 통과한다.

import { test, expect } from '@playwright/test';

test('랜딩의 앱 화면 미리보기 이미지가 로드된다 @integration', async ({ page }) => {
  await page.goto('/');
  const images = page.getByRole('region', { name: '앱 화면 미리보기' }).getByRole('img');
  await expect(images).toHaveCount(2);
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
  }
});
