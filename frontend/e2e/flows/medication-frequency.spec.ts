// Frontend Integration(@integration) — 투약 주기를 정하지 않은 약의 표시와 알림 안내.
//
// 주기는 선택 입력인데, 비우면 목록 부제목이 "· 11월 1일부터"처럼 점으로 시작했고, 매일 복용
// 알림이 한 번도 오지 않는다는 사실은 어디에도 보이지 않았다(알림 스캔은 하루 1·2·3회 약만 본다).

import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.describe('투약 주기 표시 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    await page.route('**/api/graphql', async (route) => {
      const { operationName } = route.request().postDataJSON() as { operationName?: string };
      const data =
        operationName === 'Medications'
          ? {
              medications: [
                {
                  __typename: 'Medication',
                  id: 'm1',
                  petId: 'pet-1',
                  name: '영양제',
                  dosage: '-',
                  frequency: null,
                  startDate: '2026-11-01T03:00:00.000Z',
                  endDate: null,
                  createdAt: '2026-11-01T03:00:00.000Z',
                  updatedAt: '2026-11-01T03:00:00.000Z',
                },
              ],
            }
          : {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data }),
      });
    });
  });

  test('주기가 없는 약은 부제목이 점으로 시작하지 않고, 상세에 "정하지 않음"을 보인다', async ({
    page,
  }) => {
    await page.goto('/pets/pet-1/medications');
    const card = page.getByRole('button', { name: /영양제/ });
    await expect(card).toContainText('2026년 11월 1일부터');
    await expect(card).not.toContainText('·');

    await card.click();
    await expect(page.getByText('정하지 않음')).toBeVisible();
  });

  test('투약 추가에서 주기를 비우면 매일 복용 알림이 가지 않는다고 알린다', async ({ page }) => {
    await page.goto('/pets/pet-1/medications/new');
    await expect(
      page.getByText('주기를 정하지 않으면 매일 복용 알림이 가지 않아요.'),
    ).toBeVisible();

    await page.getByRole('button', { name: '주기 선택' }).click();
    await page.getByRole('option', { name: '하루 2회' }).click();
    await expect(page.getByText(/매일 복용 알림이 가지 않아요/)).toHaveCount(0);
  });
});
