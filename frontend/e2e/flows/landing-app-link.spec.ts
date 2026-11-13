// Frontend Integration(@integration) — 랜딩의 Android 앱 설치 링크 노출 조건.
//
// 노출 판정이 브라우저 전역(Capacitor 주입 여부, UA)에 달려 있어 타입체크로는 드러나지 않는다.
// 앱 안에서 "앱 받기"가 보이거나, 설치할 앱이 없는 iPhone에 링크가 보이면 둘 다 신뢰를 깎는다.

import { test, expect, devices } from '@playwright/test';

const LINK = { name: /Google Play에서 받기/ };

test.describe('랜딩 앱 설치 링크 @integration', () => {
  test('웹 브라우저(Android·데스크톱)에서는 Play Store 링크를 보여준다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', LINK)).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=quest.petlog.app',
    );
  });

  test('앱(WebView) 안에서는 보여주지 않는다', async ({ page }) => {
    // 실제 앱에서는 네이티브 브리지가 window.androidBridge를 주입하고, @capacitor/core가 이를 보고
    // 플랫폼을 android로 판정한다. window.Capacitor를 직접 심으면 core가 로드되며 덮어쓴다.
    await page.addInitScript(() => {
      (window as unknown as { androidBridge: unknown }).androidBridge = { postMessage() {} };
    });
    await page.goto('/');
    await expect(page.getByRole('link', { name: '무료로 시작하기' })).toBeVisible();
    await expect(page.getByRole('link', LINK)).toHaveCount(0);
  });

  test.describe('iPhone', () => {
    test.use({ userAgent: devices['iPhone 13'].userAgent });

    test('설치할 앱이 없는 iOS에서는 보여주지 않는다', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: '무료로 시작하기' })).toBeVisible();
      await expect(page.getByRole('link', LINK)).toHaveCount(0);
    });
  });
});
