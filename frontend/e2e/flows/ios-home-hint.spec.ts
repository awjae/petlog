// Frontend Integration(@integration) — iPhone 사용자에게만 "홈 화면에 추가" 안내.
// 노출 조건이 UA·standalone·닫기 이력에 달려 있어 타입체크로는 드러나지 않는다.

import { test, expect, devices } from '@playwright/test';

const HINT = { name: '홈 화면에 추가 안내' };

test.describe('iOS 홈 화면 추가 안내 @integration @mock', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    // 온보딩 오버레이가 홈을 가리지 않게 완료 상태로 둔다.
    await page.addInitScript(() => localStorage.setItem('petlog:onboarding-completed', 'true'));
  });

  test('데스크톱·Android 브라우저에서는 보여주지 않는다', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('link', { name: /기록/ }).first()).toBeVisible();
    await expect(page.getByRole('note', HINT)).toHaveCount(0);
  });

  test.describe('iPhone Safari', () => {
    test.use({ userAgent: devices['iPhone 13'].userAgent });

    test('보여주고, 닫으면 다시 띄우지 않는다', async ({ page }) => {
      await page.goto('/home');
      await expect(page.getByRole('note', HINT)).toBeVisible();

      await page.getByRole('note', HINT).getByRole('button', { name: '닫기' }).click();
      await expect(page.getByRole('note', HINT)).toHaveCount(0);

      await page.reload();
      await expect(page.getByRole('link', { name: /기록/ }).first()).toBeVisible();
      await expect(page.getByRole('note', HINT)).toHaveCount(0);
    });

    test('이미 홈 화면 앱으로 열었으면 보여주지 않는다', async ({ page }) => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'standalone', { value: true }),
      );
      await page.goto('/home');
      await expect(page.getByRole('link', { name: /기록/ }).first()).toBeVisible();
      await expect(page.getByRole('note', HINT)).toHaveCount(0);
    });
  });
});
