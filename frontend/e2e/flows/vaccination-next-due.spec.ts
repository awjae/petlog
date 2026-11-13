// Frontend Integration(@integration) — 다음 접종 예정일 빠른 선택.
// 접종 알림은 예정일이 있어야만 나가므로, 칩 한 번으로 예정일이 채워지는지가 핵심이다.

import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Asia/Seoul' });

test.describe('다음 접종 예정일 빠른 선택 @integration @mock', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    await page.clock.setFixedTime(new Date('2027-03-15T03:00:00Z')); // 서울 03-15 12:00
  });

  test('1년 후를 누르면 접종일 기준 1년 뒤로 채우고, 다시 누르면 비운다', async ({ page }) => {
    await page.goto('/pets/pet-1/medical/vaccinations/new');
    const trigger = page.getByRole('button', { name: '다음 접종 예정일 선택' });
    const chip = page.getByRole('button', { name: /1년 후/ });

    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(trigger).toContainText('2028년 3월 15일');
    await expect(page.getByText(/이날 아침에 알려드려요/)).toBeVisible();

    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(trigger).toContainText('날짜 선택');
  });
});
