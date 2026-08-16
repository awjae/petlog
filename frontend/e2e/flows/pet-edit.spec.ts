// Frontend Integration(@integration) — 반려동물 정보 수정 화면의 초기값 주입.
//
// 등록 화면과 수정 화면이 같은 PetForm을 쓰게 되면서, 수정 화면에만 있는 경로는
// "서버에서 온 값을 폼에 한 번 채워 넣는 것" 하나로 좁혀졌다. 그 매핑에는 타입만으로는
// 안 걸리는 변환이 셋 있다.
//
//   - birthDate: ISO 문자열 → <input type="date">가 받는 앞 10자리
//   - gender:    서버의 'unknown' → 화면의 "고르지 않음"(아무 버튼도 눌리지 않음)
//   - breed:     null → 빈 문자열("선택 안 함")
//
// 셋 다 값이 잘못 들어가도 화면은 멀쩡히 그려진다. 사용자가 저장을 누르는 순간에야
// 엉뚱한 값이 덮어써진다. 그래서 타입체크가 아니라 실제 렌더로 확인해야 한다.
//
// 백엔드 없이 프론트만 떠 있으면 돌아간다 — PetEdit 응답을 라우트에서 직접 채운다.

import { test, expect } from '@playwright/test';

const PET_ID = 'pet-1';

const PET = {
  id: PET_ID,
  name: '초코',
  species: 'cat',
  breed: '러시안블루',
  // KST로는 2020-03-15. 앞 10자리를 그대로 쓰므로 UTC 기준 날짜가 나와야 한다.
  birthDate: '2020-03-15T12:00:00.000Z',
  gender: 'female',
  weight: null,
  isNeutered: true,
  profileImageUrl: null,
};

/**
 * 이 화면이 부팅하며 보내는 GraphQL 세 건을 모두 채운다.
 *
 * 빈 객체로 뭉개면 Apollo가 "Missing field"로 던지고 앱 에러 바운더리(app/error.tsx)가
 * 화면을 통째로 덮어써, 정작 보려던 폼에 도달하지 못한다.
 */
async function stubGraphql(page: import('@playwright/test').Page, pet: Record<string, unknown>) {
  await page.route('**/api/graphql', async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const data =
      body?.operationName === 'PetEdit'
        ? { pet: { __typename: 'Pet', ...pet } }
        : body?.operationName === 'PetIds'
          ? { pets: [{ __typename: 'Pet', id: PET_ID }] }
          : { me: { __typename: 'User', id: 'user-1' } };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });
}

test.describe('반려동물 정보 수정 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('서버에서 온 값이 폼에 채워진다', async ({ page }) => {
    await stubGraphql(page, PET);
    await page.goto(`/pets/${PET_ID}/edit`);

    await expect(page.getByLabel(/이름/)).toHaveValue('초코');
    await expect(page.getByLabel(/품종/)).toHaveValue('러시안블루');
    // ISO 문자열이 그대로 들어가면 빈 값이 된다.
    await expect(page.getByLabel(/생년월일/)).toHaveValue('2020-03-15');
    await expect(page.getByRole('button', { name: '고양이' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: '암컷' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('switch', { name: '중성화 완료' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('성별 unknown은 아무것도 고르지 않은 상태로 둔다', async ({ page }) => {
    await stubGraphql(page, { ...PET, gender: 'unknown', breed: null, birthDate: null });
    await page.goto(`/pets/${PET_ID}/edit`);

    await expect(page.getByLabel(/이름/)).toHaveValue('초코');
    await expect(page.getByRole('button', { name: '수컷' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByRole('button', { name: '암컷' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // breed/birthDate가 null이면 빈 값이어야 한다("선택 안 함").
    await expect(page.getByLabel(/품종/)).toHaveValue('');
    await expect(page.getByLabel(/생년월일/)).toHaveValue('');
  });

  test('저장하면 화면에 보이던 값 그대로 나간다', async ({ page }) => {
    // 초기값을 읽어 들이는 것만으로는 절반이다. 잘못 채워진 값은 저장하는 순간
    // 서버에 덮어써지므로, 나가는 변수까지 봐야 왕복이 검증된다.
    await stubGraphql(page, { ...PET, gender: 'unknown' });
    await page.goto(`/pets/${PET_ID}/edit`);
    await expect(page.getByLabel(/이름/)).toHaveValue('초코');

    const mutation = page.waitForRequest(
      (req) =>
        req.url().includes('/api/graphql') && req.postDataJSON()?.operationName === 'UpdatePet',
    );
    await page.getByRole('button', { name: '저장' }).click();
    const input = (await mutation).postDataJSON().variables.input;

    expect(input).toMatchObject({
      name: '초코',
      species: 'cat',
      breed: '러시안블루',
      isNeutered: true,
      // 화면에서 "고르지 않음"이었으니 그대로 unknown으로 돌아가야 한다.
      gender: 'unknown',
    });
    // ISO로 변환돼 나가되, 가리키는 날짜는 화면에 보이던 그날이어야 한다.
    expect(input.birthDate).toContain('2020-03-15');
  });

  test('삭제 링크는 수정 화면에만 있다', async ({ page }) => {
    await stubGraphql(page, PET);
    await page.goto(`/pets/${PET_ID}/edit`);
    await expect(page.getByRole('button', { name: '반려동물 삭제' })).toBeVisible();

    await page.goto('/pets/new');
    await expect(page.getByRole('button', { name: '등록하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '반려동물 삭제' })).toHaveCount(0);
  });
});
