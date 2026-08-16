import { test, expect } from '@playwright/test';
test('debug @integration', async ({ page }) => {
  await page.goto('/register');
  await page
    .locator('div')
    .filter({ hasText: /이용약관 동의/ })
    .getByRole('button', { name: '보기' })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: '이용약관' })).toBeVisible();
  const info = await page.evaluate(() => {
    const el = document.elementFromPoint(10, 10) as HTMLElement;
    const cs = el ? getComputedStyle(el) : null;
    const root = document.querySelector('[role=dialog]')?.parentElement as HTMLElement;
    return {
      atPoint: el?.className || el?.tagName,
      atPointPE: cs?.pointerEvents,
      rootClass: root?.className,
      rootPE: root ? getComputedStyle(root).pointerEvents : null,
      overlayPE: root ? getComputedStyle(root.firstElementChild as Element).pointerEvents : null,
      overlayClass: (root?.firstElementChild as HTMLElement)?.className,
    };
  });
  console.log(JSON.stringify(info, null, 2));
});
