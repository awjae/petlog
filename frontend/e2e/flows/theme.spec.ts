// Frontend Integration(@integration) — 화면 모드(시스템/라이트/다크).
//
// 결정 문서: .claude/docs/decisions/030-design-token-roles-and-theme-mode.md
//
// 네트워크를 타지 않는 공개 경로(/login)만 쓰므로 MSW도 백엔드도 필요 없다.
// 검증 대상은 "저장된 선택 → 첫 페인트 → 하이드레이션" 사이에서 명암이 뒤집히지
// 않는가다. 이 구간은 인라인 스크립트(app/layout.tsx)와 ThemeProvider가 나눠 맡고
// 있어, 둘의 손발이 맞는지는 실제 브라우저에서만 확인할 수 있다.
//
// 실제로 이 테스트가 필요했던 이유: 마운트 시 두 effect가 같은 커밋에서 실행되면서
// 저장값을 읽기 전의 mode('system')로 DOM을 OS 값으로 덮어쓰는 회귀가 있었다.
// 사용자가 고른 다크가 새로고침마다 라이트로 뒤집혔고, 코드만 봐서는 드러나지 않았다.

import { test, expect } from '@playwright/test';

const LOGIN_PATH = '/login';

/** 라이트/다크 배경 토큰(--color-bg)의 실제 렌더 결과. */
const BG = {
  light: 'rgb(244, 240, 230)',
  dark: 'rgb(20, 18, 16)',
};

async function readMode(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    mode: document.documentElement.dataset.mode,
    background: getComputedStyle(document.body).backgroundColor,
  }));
}

test.describe('화면 모드 @integration', () => {
  test('저장된 다크 선택이 OS 라이트 설정을 이기고 하이드레이션 후에도 유지된다', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
      window.localStorage.setItem('petlog-theme-mode', 'dark');
    });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'domcontentloaded' });
    // 첫 페인트: 인라인 스크립트가 저장값을 심는다.
    expect((await readMode(page)).mode).toBe('dark');

    // 하이드레이션 이후에도 뒤집히지 않아야 한다.
    await page.waitForLoadState('networkidle');
    await expect.poll(async () => (await readMode(page)).mode, { timeout: 5000 }).toBe('dark');
    expect((await readMode(page)).background).toBe(BG.dark);

    await context.close();
  });

  test('저장된 라이트 선택이 OS 다크 설정을 이긴다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() => {
      window.localStorage.setItem('petlog-theme-mode', 'light');
    });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
    await expect.poll(async () => (await readMode(page)).mode, { timeout: 5000 }).toBe('light');
    expect((await readMode(page)).background).toBe(BG.light);

    await context.close();
  });

  test("'시스템'은 OS 설정을 따라간다", async ({ browser }) => {
    for (const scheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ colorScheme: scheme });
      await context.addInitScript(() => {
        window.localStorage.setItem('petlog-theme-mode', 'system');
      });
      const page = await context.newPage();

      await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
      await expect.poll(async () => (await readMode(page)).mode, { timeout: 5000 }).toBe(scheme);
      expect((await readMode(page)).background).toBe(BG[scheme]);

      await context.close();
    }
  });

  test('저장값이 없으면 OS 설정을 따른다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
    expect((await readMode(page)).mode).toBe('dark');

    await context.close();
  });

  test('팔레트(로즈 핑크)와 명암은 서로 독립적으로 적용된다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
      window.localStorage.setItem('petlog-theme', 'pastel-pink');
      window.localStorage.setItem('petlog-theme-mode', 'dark');
    });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      mode: document.documentElement.dataset.mode,
      primary: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim(),
    }));

    expect(state).toEqual({ theme: 'pastel-pink', mode: 'dark', primary: '#e79ab0' });

    await context.close();
  });

  test('공유 이미지 미리보기 영역은 다크에서도 라이트 팔레트를 쓴다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });

    // shareImage.ts가 라이트 팔레트를 읽을 때와 같은 방식(data-mode="light" 요소).
    const palette = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.dataset.mode = 'light';
      document.body.appendChild(probe);
      const read = (name: string) => getComputedStyle(probe).getPropertyValue(name).trim();
      const result = { bg: read('--color-bg'), text: read('--color-text-primary') };
      probe.remove();
      return result;
    });

    expect(palette).toEqual({ bg: '#f4f0e6', text: '#2d3c48' });

    await context.close();
  });
});
