// Frontend Integration(@integration) — 기록 저장 직후 연속 기록 축하.
// 계산은 streakAfterSave.test.ts가 맡고, 여기서는 홈 쿼리의 recordDates가 저장 화면까지
// 전달되는지(배선)를 본다. 끊기면 축하가 조용히 사라질 뿐이라 화면에서 확인한다.

import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', timezoneId: 'Asia/Seoul' });

// 서울 2027-03-15 20:00. 실제 오늘과 겹치지 않는 날짜로 고정한다(record-date.spec.ts 참고).
const NOW = new Date('2027-03-15T11:00:00Z');
const day = (ymd: string) => new Date(`${ymd}T03:00:00Z`).toISOString(); // KST 정오

async function stub(page: Page, recordDates: string[]) {
  await page.route('**/api/graphql', async (route) => {
    const { operationName } = route.request().postDataJSON() as { operationName?: string };
    const data =
      operationName === 'HomeQuery'
        ? {
            me: {
              __typename: 'User',
              id: 'u',
              recordDates,
              upcomingSchedules: [],
              pets: [
                {
                  __typename: 'Pet',
                  id: 'pet-1',
                  name: '초코',
                  species: 'dog',
                  breed: null,
                  birthDate: null,
                  profileImageUrl: null,
                  recentWeight: null,
                  todayRecordCount: 0,
                  totalHealthRecordCount: recordDates.length,
                  recentHealthRecords: [],
                },
              ],
            },
          }
        : operationName === 'CreateHealthRecord'
          ? {
              createHealthRecord: {
                __typename: 'HealthRecord',
                id: 'r',
                type: 'weight',
                recordedAt: day('2027-03-15'),
              },
            }
          : {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });
}

async function saveWeight(page: Page) {
  await page.goto('/records/new?petId=pet-1&type=weight');
  await page.getByLabel('체중 (kg)').fill('4.2');
  await page.getByRole('button', { name: '저장하기' }).click();
}

test.describe('연속 기록 축하 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    await page.clock.setFixedTime(NOW);
  });

  test('3일째 기록을 저장하면 마일스톤으로 축하한다', async ({ page }) => {
    await stub(page, [day('2027-03-13'), day('2027-03-14')]);
    await saveWeight(page);

    await expect(page.getByRole('status')).toContainText('3일 연속 기록');
    await expect(page.getByText('꾸준함이 쌓이고 있어요')).toBeVisible();
  });

  test('오늘 두 번째 기록이면 연속 기록을 다시 보여주지 않는다', async ({ page }) => {
    await stub(page, [day('2027-03-14'), day('2027-03-15')]);
    await saveWeight(page);

    await expect(page.getByRole('status')).toContainText('기록했어요!');
    await expect(page.getByText(/연속 기록/)).toHaveCount(0);
  });
});
