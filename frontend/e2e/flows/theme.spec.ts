// Frontend Integration(@integration) — 화면 모드(시스템/라이트/다크).
//
// 결정 문서: .claude/docs/decisions/030-design-token-roles-and-theme-mode.md
//
// 이 테스트가 지키는 것은 "색이 예쁜가"가 아니라 **상태 초기화 순서**다.
// 저장된 선택 → 첫 페인트(app/layout.tsx 인라인 스크립트) → 하이드레이션(ThemeProvider)
// 사이에서 명암이 뒤집히지 않아야 한다. 이 구간을 둘이 나눠 맡고 있어 손발이 맞는지는
// 실제 브라우저에서만 확인할 수 있고, 타입체크나 린트로는 드러나지 않는다.
//
// 실제로 이 테스트가 필요했던 이유: 마운트 시 두 effect가 같은 커밋에서 실행되면서
// 저장값을 읽기 전의 mode('system')로 DOM을 OS 값으로 덮어쓰는 회귀가 있었다.
// 사용자가 고른 다크가 새로고침마다 라이트로 뒤집혔다.
//
// 단언에 색 값을 쓰지 않는다. 토큰을 조정했다는 이유로 깨지는 테스트는 유지비만 남기고
// 아무것도 지켜주지 못하기 때문이다. 대신 "어떤 모드가 적용됐는가"라는 계약만 본다.
//
// 네트워크를 타지 않는 공개 경로(/login)만 쓰므로 MSW도 백엔드도 필요 없다.

import { test, expect, type Page } from '@playwright/test';

const LOGIN_PATH = '/login';

/**
 * 현재 적용된 명암과 "그게 실제 화면에 반영됐는지"를 함께 읽는다.
 *
 * data-mode 속성만 보면 CSS가 실제로 그 값을 쓰고 있는지는 알 수 없다.
 * body의 배경이 지금 문서의 --color-bg 토큰과 같은지까지 확인해, 속성만 바뀌고
 * 스타일은 안 따라오는 상태를 걸러낸다. 두 값 모두 브라우저가 계산한 결과라
 * 토큰 값이 무엇이든 비교가 성립한다.
 */
async function readAppliedMode(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;

    const probe = document.createElement('div');
    probe.style.background = 'var(--color-bg)';
    document.body.appendChild(probe);
    const expectedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();

    return {
      mode: root.dataset.mode,
      theme: root.dataset.theme,
      backgroundMatchesToken:
        getComputedStyle(document.body).backgroundColor === expectedBackground,
    };
  });
}

/** 문서가 다크여도 라이트 토큰을 갖는 하위 트리(공유 이미지/미리보기)를 읽는다. */
async function readLightSubtree(page: Page) {
  return page.evaluate(() => {
    const toLuminance = (color: string) => {
      const [r, g, b] = color.match(/\d+/g)!.map((v) => Number(v) / 255);
      const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };

    const probe = document.createElement('div');
    probe.dataset.mode = 'light';
    document.body.appendChild(probe);

    const bg = document.createElement('div');
    bg.style.background = 'var(--color-bg)';
    const text = document.createElement('div');
    text.style.background = 'var(--color-text-primary)';
    probe.append(bg, text);

    const result = {
      backgroundLuminance: toLuminance(getComputedStyle(bg).backgroundColor),
      textLuminance: toLuminance(getComputedStyle(text).backgroundColor),
    };
    probe.remove();
    return result;
  });
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
    expect((await readAppliedMode(page)).mode).toBe('dark');

    // 하이드레이션 이후에도 뒤집히지 않아야 한다.
    await page.waitForLoadState('networkidle');
    await expect
      .poll(async () => (await readAppliedMode(page)).mode, { timeout: 5000 })
      .toBe('dark');
    expect((await readAppliedMode(page)).backgroundMatchesToken).toBe(true);

    await context.close();
  });

  test('저장된 라이트 선택이 OS 다크 설정을 이긴다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() => {
      window.localStorage.setItem('petlog-theme-mode', 'light');
    });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
    await expect
      .poll(async () => (await readAppliedMode(page)).mode, { timeout: 5000 })
      .toBe('light');
    expect((await readAppliedMode(page)).backgroundMatchesToken).toBe(true);

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
      await expect
        .poll(async () => (await readAppliedMode(page)).mode, { timeout: 5000 })
        .toBe(scheme);

      await context.close();
    }
  });

  test('저장값이 없으면 OS 설정을 따른다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });
    expect((await readAppliedMode(page)).mode).toBe('dark');

    await context.close();
  });

  test('팔레트와 명암은 서로 독립적으로 적용된다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
      window.localStorage.setItem('petlog-theme', 'pastel-pink');
      window.localStorage.setItem('petlog-theme-mode', 'dark');
    });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });

    const applied = await readAppliedMode(page);
    expect(applied.theme).toBe('pastel-pink');
    expect(applied.mode).toBe('dark');

    // 같은 팔레트의 라이트 값과 달라야 "명암이 실제로 적용됐다"고 할 수 있다.
    const primaries = await page.evaluate(() => {
      const read = (el: Element) => getComputedStyle(el).getPropertyValue('--color-primary').trim();

      const probe = document.createElement('div');
      probe.dataset.mode = 'light';
      document.body.appendChild(probe);
      const result = { dark: read(document.documentElement), light: read(probe) };
      probe.remove();
      return result;
    });

    expect(primaries.dark).not.toBe(primaries.light);

    await context.close();
  });

  test('공유 이미지 영역은 다크에서도 밝은 배경 + 어두운 글씨를 유지한다', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto(LOGIN_PATH, { waitUntil: 'networkidle' });

    expect((await readAppliedMode(page)).mode).toBe('dark');

    // shareImage.ts / SharePreviewFrame이 쓰는 것과 같은 방식(data-mode="light").
    const { backgroundLuminance, textLuminance } = await readLightSubtree(page);
    expect(backgroundLuminance).toBeGreaterThan(0.5);
    expect(textLuminance).toBeLessThan(0.5);

    await context.close();
  });
});
