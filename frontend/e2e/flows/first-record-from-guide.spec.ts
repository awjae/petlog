// Frontend Integration(@integration) — 가입 전에 읽은 가이드 주제로 첫 기록 화면이 열리는지.
//
// 실패하면 화면은 멀쩡하고 기본 유형(체중)으로 열릴 뿐이라 눈에 띄지 않는다. 그래서
// "구토 가이드를 읽고 왔는데 체중 기록이 열린다"를 직접 밟아 본다.

import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const PET = {
  __typename: 'Pet',
  id: 'pet-9',
  name: '보리',
  species: 'dog',
  breed: null,
  birthDate: null,
  profileImageUrl: null,
  recentWeight: null,
  todayRecordCount: 0,
  totalHealthRecordCount: 0,
  recentHealthRecords: [],
};

async function stubBackend(page: Page) {
  await page.route('**/api/visits', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/graphql', async (route) => {
    const { operationName } = route.request().postDataJSON() as { operationName?: string };
    const data =
      operationName === 'CreatePet'
        ? { createPet: { __typename: 'Pet', id: 'pet-9', name: '보리', species: 'dog' } }
        : operationName === 'HomeQuery'
          ? {
              me: {
                __typename: 'User',
                id: 'u',
                recordDates: [],
                upcomingSchedules: [],
                pets: [PET],
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

async function registerPet(page: Page) {
  await page.goto('/pets/new');
  await page.getByLabel('이름', { exact: false }).fill('보리');
  await page.getByRole('button', { name: '등록하기' }).click();
  await expect(page).toHaveURL(/\/records\/new\?petId=pet-9/);
}

test.describe('가이드 주제로 첫 기록 열기 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
    await stubBackend(page);
  });

  test('구토 가이드로 처음 들어왔으면 첫 기록이 구토 유형으로 열린다', async ({ page }) => {
    await page.goto('/guides/dog-vomit');
    await registerPet(page);

    await expect(page).toHaveURL(/type=vomit/);
    await expect(page.getByRole('button', { name: '구토' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('한 번 쓰고 나면 다음 반려동물 등록에는 적용하지 않는다', async ({ page }) => {
    await page.goto('/guides/dog-vomit');
    await registerPet(page);
    await registerPet(page);

    await expect(page).not.toHaveURL(/type=/);
  });

  test('가이드 없이 들어왔으면 기본 유형 그대로 연다', async ({ page }) => {
    await registerPet(page);
    await expect(page).not.toHaveURL(/type=/);
  });
});
