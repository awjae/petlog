// Frontend Integration(@integration) — 가이드 공유 버튼의 세 갈래(공유 시트 / 링크 복사 / 취소).
// 공유 시트 유무는 브라우저마다 달라 타입체크로는 드러나지 않는다. 시트를 닫았을 때
// "복사했어요"가 뜨면 사용자가 하지 않은 일을 했다고 말하는 셈이라 함께 본다.

import { test, expect } from '@playwright/test';

const GUIDE = '/guides/pet-temperature';
const URL = 'https://petlog.quest/guides/pet-temperature';

test.describe('가이드 공유 @integration', () => {
  test('공유 시트가 있으면 글 제목과 정식 주소로 공유한다', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared?: ShareData };
      navigator.share = async (data) => {
        w.__shared = data;
      };
    });
    await page.goto(GUIDE);
    await page.getByRole('button', { name: '이 글 공유하기' }).click();

    const shared = await page.evaluate(
      () => (window as unknown as { __shared?: ShareData }).__shared,
    );
    expect(shared?.url).toBe(URL);
    expect(shared?.title).toContain('체온');
  });

  test('공유 시트가 없으면 링크를 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined });
    });
    await page.goto(GUIDE);
    await page.getByRole('button', { name: '이 글 공유하기' }).click();

    await expect(page.getByRole('status').filter({ hasText: '링크를 복사했어요' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(URL);
  });

  test('공유 시트를 닫으면 아무 안내도 띄우지 않는다', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.share = async () => {
        throw new DOMException('cancel', 'AbortError');
      };
    });
    await page.goto(GUIDE);
    await page.getByRole('button', { name: '이 글 공유하기' }).click();

    await expect(page.getByText(/복사/)).toHaveCount(0);
  });
});
