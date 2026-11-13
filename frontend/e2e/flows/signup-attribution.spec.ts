// Frontend Integration(@integration) — 가입 요청에 처음 들어온 경로(first-touch)가 실리는지.
//
// 계측은 실패해도 화면이 멀쩡해서, 깨지면 "가입자는 있는데 출처가 전부 비어 있다"로만
// 나타난다. 처음 방문 → 다른 페이지 → 가입 순서로 밟아 first-touch가 덮이지 않는지 본다.

import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.describe('가입 경로 기록 @integration', () => {
  test('처음 들어온 가이드와 utm_source가 가입 요청에 실린다', async ({ page }) => {
    await page.route('**/api/visits', (route) => route.fulfill({ status: 204 }));
    let registerBody: Record<string, unknown> | undefined;
    await page.route('**/api/auth/register', async (route) => {
      registerBody = route.request().postDataJSON();
      await route.fulfill({ status: 400, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/guides/dog-vomit?utm_source=instagram');
    // 다른 공개 페이지를 거쳐도 first-touch는 덮이지 않아야 한다.
    await page.goto('/sample-report');
    await page.goto('/register');

    await page.getByLabel('이메일').fill('first-touch@petlog.test');
    await page.locator('#password').fill('password123');
    await page.locator('#confirm').fill('password123');
    await page.locator('label[for="agree-all"]').click();
    await page.getByRole('button', { name: /가입/ }).click();

    await expect.poll(() => registerBody).toBeDefined();
    expect(registerBody?.attribution).toEqual({
      landingPath: '/guides/dog-vomit',
      utmSource: 'instagram',
    });
  });
});
