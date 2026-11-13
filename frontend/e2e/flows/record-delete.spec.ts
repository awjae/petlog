// Frontend Integration(@integration) — 잘못 입력한 건강 기록을 지울 수 있는지.
//
// 백엔드에는 deleteHealthRecord가 있었지만 프론트에 삭제 경로가 없어, 4.2kg를 42로 잘못
// 넣으면 그래프·체중 변화 안내·AI 리포트에 영원히 남았다. 되돌릴 수 없는 동작이라
// 확인 대화상자를 거치는지, 취소하면 아무것도 지우지 않는지를 함께 본다.

import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const record = (id: string, numValue: number) => ({
  __typename: 'HealthRecord',
  id,
  type: 'weight',
  recordedAt: '2026-11-13T03:00:00.000Z',
  numValue,
  textValue: null,
  note: null,
});

async function stub(page: Page, opts: { deleteFails?: boolean } = {}) {
  let records = [record('r-typo', 42), record('r-ok', 4.2)];
  const deleted: string[] = [];
  await page.route('**/api/graphql', async (route) => {
    const { operationName, variables } = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { id?: string };
    };
    if (operationName === 'DeleteHealthRecord') {
      if (opts.deleteFails) return route.fulfill({ status: 502, body: 'bad gateway' });
      deleted.push(variables!.id!);
      records = records.filter((r) => r.id !== variables!.id);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { deleteHealthRecord: true } }),
      });
    }
    const data = operationName === 'HealthRecords' ? { healthRecords: records } : {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });
  return deleted;
}

test.describe('건강 기록 삭제 @integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .addCookies([
        { name: 'access_token', value: 'integration-test', url: baseURL!, httpOnly: true },
      ]);
  });

  test('확인하면 그 기록만 지우고 목록에서 사라진다', async ({ page }) => {
    const deleted = await stub(page);
    let message = '';
    page.on('dialog', (d) => {
      message = d.message();
      void d.accept();
    });
    await page.goto('/pets/pet-1/timeline');
    await expect(page.getByText('42 kg')).toBeVisible();

    await page.getByRole('button', { name: '체중 기록 삭제' }).first().click();

    await expect(page.getByText('42 kg')).toHaveCount(0);
    await expect(page.getByText('4.2 kg')).toBeVisible();
    expect(deleted).toEqual(['r-typo']);
    // 무엇을 지우는지 보여주고 묻는다.
    expect(message).toContain('42 kg');
  });

  test('취소하면 지우지 않는다', async ({ page }) => {
    const deleted = await stub(page);
    page.on('dialog', (d) => void d.dismiss());
    await page.goto('/pets/pet-1/timeline');
    await page.getByRole('button', { name: '체중 기록 삭제' }).first().click();

    await expect(page.getByText('42 kg')).toBeVisible();
    expect(deleted).toEqual([]);
  });

  test('삭제에 실패하면 안내하고 기록은 남아 있다', async ({ page }) => {
    await stub(page, { deleteFails: true });
    const messages: string[] = [];
    page.on('dialog', (d) => {
      messages.push(d.message());
      void d.accept();
    });
    await page.goto('/pets/pet-1/timeline');
    await page.getByRole('button', { name: '체중 기록 삭제' }).first().click();

    await expect.poll(() => messages.length).toBe(2);
    expect(messages[1]).toContain('삭제하지 못했어요');
    await expect(page.getByText('42 kg')).toBeVisible();
  });
});
