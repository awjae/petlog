// Frontend Integration(@integration) — 일찍 끊은 약을 이력은 남기고 오늘로 끝내기.
//
// 종료일 없이 등록한 약은 매일 아침·저녁 알림이 끝없이 나가는데, 멈추는 방법이 삭제뿐이면
// 병원 내보내기에 쓰일 투약 이력이 사라진다. 오늘로 종료일만 바꾸는지 본다.

import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', timezoneId: 'Asia/Seoul' });

const NOW = new Date('2027-03-15T03:00:00Z'); // 서울 03-15 12:00

async function stub(page: Page) {
  const updates: { id: string; endDate: string }[] = [];
  let endDate: string | null = null;
  await page.route('**/api/graphql', async (route) => {
    const { operationName, variables } = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { id: string; input: { endDate: string } };
    };
    if (operationName === 'EndMedication') {
      updates.push({ id: variables!.id, endDate: variables!.input.endDate });
      endDate = variables!.input.endDate;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { updateMedication: { __typename: 'Medication', id: 'm1', endDate } },
        }),
      });
    }
    const data =
      operationName === 'Medications'
        ? {
            medications: [
              {
                __typename: 'Medication',
                id: 'm1',
                petId: 'pet-1',
                name: '심장약',
                dosage: '-',
                frequency: 'twiceDaily',
                startDate: '2027-03-01T03:00:00.000Z',
                endDate,
                createdAt: '2027-03-01T03:00:00.000Z',
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
  return updates;
}

test.describe('투약 오늘로 끝내기 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    await page.clock.setFixedTime(NOW);
  });

  test('확인하면 종료일을 오늘(로컬 정오)로 바꾸고 버튼을 거둔다', async ({ page }) => {
    const updates = await stub(page);
    page.on('dialog', (d) => void d.accept());
    await page.goto('/pets/pet-1/medications');

    await expect(page.getByRole('button', { name: '오늘로 끝내기' })).toHaveCount(0);
    await page.getByText('심장약').click();
    await page.getByRole('button', { name: '오늘로 끝내기' }).click();

    await expect.poll(() => updates).toEqual([{ id: 'm1', endDate: '2027-03-15T03:00:00.000Z' }]);
    await expect(page.getByRole('button', { name: '오늘로 끝내기' })).toHaveCount(0);
    await expect(page.getByText('종료일')).toBeVisible();
  });

  test('취소하면 바꾸지 않는다', async ({ page }) => {
    const updates = await stub(page);
    page.on('dialog', (d) => void d.dismiss());
    await page.goto('/pets/pet-1/medications');
    await page.getByText('심장약').click();
    await page.getByRole('button', { name: '오늘로 끝내기' }).click();

    await expect(page.getByRole('button', { name: '오늘로 끝내기' })).toBeVisible();
    expect(updates).toEqual([]);
  });
});
