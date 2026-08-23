// Frontend Integration(@integration) — 목업 모드에서 홈 → 상세 → 수정으로 이어지는 이동.
//
// 이 스펙은 stub을 쓰지 않는다. 검증 대상이 MSW 핸들러 자체이기 때문이다.
// NEXT_PUBLIC_USE_MOCK=true로 띄운 빌드(CI가 그렇다)에서 워커가 PetDetail·PetEdit을
// 받아내지 못하면 요청이 실제 백엔드로 새어 나가 404가 되고, 화면은 "반려동물을
// 찾을 수 없어요"로 바뀐다. 목업 모드는 백엔드 없이 개발하기 위한 것이므로 이 누수는
// 목업 모드 전체를 무용지물로 만든다.

import { test, expect } from '@playwright/test';

const MOCK_PET_ID = 'pet-1';
const MOCK_PET_NAME = '초코';

test.describe('목업 모드 반려동물 상세 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('상세 화면이 목업 반려동물을 보여준다', async ({ page }) => {
    await page.goto(`/pets/${MOCK_PET_ID}`);

    // 이름은 페이지 제목(h1)과 프로필 요약(h2) 두 곳에 나오므로 h1로 좁힌다.
    await expect(page.getByRole('heading', { name: MOCK_PET_NAME, level: 1 })).toBeVisible();
    await expect(page.getByText('반려동물을 찾을 수 없어요')).toHaveCount(0);
  });

  test('수정 화면도 같은 반려동물로 채워진다', async ({ page }) => {
    await page.goto(`/pets/${MOCK_PET_ID}/edit`);

    await expect(page.getByLabel(/이름/)).toHaveValue(MOCK_PET_NAME);
    await expect(page.getByText('반려동물을 찾을 수 없어요')).toHaveCount(0);
  });

  test('없는 id는 찾을 수 없음 화면으로 간다', async ({ page }) => {
    // 목업이 아무 id에나 반려동물을 만들어주면, 화면이 404를 어떻게 다루는지는
    // 목업 모드에서 영영 확인할 수 없게 된다.
    await page.goto('/pets/does-not-exist');

    await expect(page.getByText('반려동물을 찾을 수 없어요')).toBeVisible();
  });
});
