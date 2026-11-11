// Frontend Integration(@integration) — 기록 저장의 성공·실패 상태.
//
// 실패 문구는 원인별로 다르다(src/lib/apollo/mutationFailure.ts). 서버가 값을 거절한 것과
// 서버가 고장난 것, 요청이 닿지 못한 것은 사용자가 할 일이 다르기 때문이다. 분류 함수만
// 맞고 화면이 다른 경로로 에러를 받으면(예: onError 대신 catch에서 삼킴) 사용자는 아무
// 안내도 못 본다 — 그래서 실제 화면에서 원인별 문구를 확인한다.
//
// 백엔드 없이 GraphQL을 page.route로 대신한다. 목업 모드로 띄운 프론트에서는 MSW
// Service Worker가 요청을 먼저 가로채 page.route가 동작하지 않으므로 워커를 막는다.

import { test, expect, type Route } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const HOME = {
  data: {
    me: {
      __typename: 'User',
      id: 'user-1',
      recordDates: [],
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
          totalHealthRecordCount: 0,
          recentHealthRecords: [],
        },
      ],
    },
  },
};

type CreateResponse = (route: Route) => Promise<void>;

async function stubGraphql(page: import('@playwright/test').Page, onCreate: CreateResponse) {
  await page.route('**/api/graphql', async (route) => {
    const { operationName } = route.request().postDataJSON() as { operationName?: string };
    if (operationName === 'CreateHealthRecord') return onCreate(route);
    const body = operationName === 'HomeQuery' ? HOME : { data: {} };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

// Next가 페이지마다 role="alert"인 라우트 안내 영역을 두므로 getByRole('alert')만으로는
// 두 요소에 걸린다. 문구로 찾고, 그 요소가 스크린리더에 알려지는지(role)를 확인한다.
async function expectAlert(page: import('@playwright/test').Page, message: string) {
  await expect(page.getByText(message)).toHaveAttribute('role', 'alert');
}

async function submitWeight(page: import('@playwright/test').Page) {
  await page.goto('/records/new?petId=pet-1&type=weight');
  await page.getByLabel('체중 (kg)').fill('4.2');
  await page.getByRole('button', { name: '저장하기' }).click();
}

test.describe('기록 저장 상태 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('저장에 성공하면 완료 화면을 보여준다', async ({ page }) => {
    await stubGraphql(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            createHealthRecord: {
              __typename: 'HealthRecord',
              id: 'rec-1',
              type: 'weight',
              recordedAt: '2026-10-29T03:00:00.000Z',
            },
          },
        }),
      }),
    );

    await submitWeight(page);

    await expect(page.getByRole('status')).toContainText('기록했어요!');
  });

  test('서버가 값을 거절하면 입력을 확인하라고 안내한다', async ({ page }) => {
    await stubGraphql(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          errors: [
            { message: 'numValue must be positive', extensions: { code: 'BAD_USER_INPUT' } },
          ],
        }),
      }),
    );

    await submitWeight(page);

    await expectAlert(page, '저장하지 못했어요. 입력한 내용을 확인해주세요');
    // 실패 후에도 입력이 남아 있어야 고쳐서 다시 저장할 수 있다.
    await expect(page.getByLabel('체중 (kg)')).toHaveValue('4.2');
  });

  test('서버 장애면 잠시 후 다시 시도하라고 안내한다', async ({ page }) => {
    await stubGraphql(page, (route) =>
      route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad Gateway</html>' }),
    );

    await submitWeight(page);

    await expectAlert(page, '일시적인 오류예요. 잠시 후 다시 시도해주세요');
  });

  test('요청이 서버에 닿지 못하면 연결 상태를 안내한다', async ({ page }) => {
    await stubGraphql(page, (route) => route.abort('connectionfailed'));

    await submitWeight(page);

    await expectAlert(page, '연결이 불안정해요. 잠시 후 다시 시도해주세요');
  });
});
