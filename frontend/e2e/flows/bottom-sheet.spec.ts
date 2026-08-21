// Frontend Integration(@integration) — 바텀시트 껍데기(shared/components/BottomSheet).
//
// 시트 9종이 각자 복제하던 오버레이/시트 박스/닫기 경로를 BottomSheet 하나로 모았다.
// 그 껍데기가 지키는 계약은 타입체크로도 순수 함수 테스트로도 드러나지 않는다 —
// 닫기 경로가 세 갈래(닫기 버튼 / 오버레이 탭 / Escape)인데, 이전에는 시트마다
// 따로 배선돼 있어서 한 곳을 빠뜨려도 아무것도 알려주지 않았다.
//
// 검증 대상은 껍데기지 특정 화면이 아니라서, 인증도 네트워크도 필요 없는 회원가입
// 화면의 약관 시트를 대표로 쓴다. 여기가 깨지면 나머지 8종도 같이 깨진다.

import { test, expect } from '@playwright/test';

// 동의 항목의 "보기" 버튼은 DOM 순서대로 이용약관, 개인정보처리방침 둘뿐이다.
const VIEW_BUTTON_INDEX = { terms: 0, privacy: 1 };

async function openSheet(page: import('@playwright/test').Page, doc: 'terms' | 'privacy') {
  const name = doc === 'terms' ? '이용약관' : '개인정보처리방침';
  const sheet = page.getByRole('dialog', { name });
  await page.getByRole('button', { name: '보기' }).nth(VIEW_BUTTON_INDEX[doc]).click();

  // 열림 애니메이션이 끝날 때까지 기다린다. 시작 시점에는 껍데기가 아직
  // pointer-events: none이라, 곧바로 오버레이를 눌러도 클릭이 통과해버린다.
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS('opacity', '1');
  return sheet;
}

const openTermsSheet = (page: import('@playwright/test').Page) => openSheet(page, 'terms');

test.describe('바텀시트 @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('약관 보기를 누르면 시트가 열린다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    // 껍데기가 접근성 속성을 붙이는지 — 이전에는 시트마다 손으로 적었다.
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    await expect(sheet).toContainText('제1조');
  });

  test('닫기 버튼으로 닫힌다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    await sheet.getByRole('button', { name: '닫기' }).click();
    await expect(sheet).toBeHidden();
  });

  test('오버레이를 탭하면 닫힌다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    // 오버레이는 aria-hidden이라 역할로 잡을 수 없다. 시트 밖 좌표를 직접 누른다.
    await page.mouse.click(10, 10);
    await expect(sheet).toBeHidden();
  });

  test('Escape로 닫힌다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('닫은 뒤 다시 열 수 있다', async ({ page }) => {
    // 전환 상태(mounted/visible)를 잘못 되돌리면 두 번째 열기에서 시트가 뜨지 않거나
    // 애니메이션 없이 튀어나온다. 열기→닫기→열기까지 밟아야 드러난다.
    const sheet = await openTermsSheet(page);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await openTermsSheet(page);
    await expect(sheet).toBeVisible();
  });

  test('다른 문서를 고르면 그 문서가 열린다', async ({ page }) => {
    await openTermsSheet(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '이용약관' })).toBeHidden();

    await openSheet(page, 'privacy');
  });
});

// ── 아래로 끌어 닫기 ──
//
// integration 프로젝트는 Desktop Chrome(hasTouch: false)이라 기본 상태로는 TouchEvent를
// 만들 수 없다. 이 블록에서만 hasTouch를 켠다 — 별도 프로젝트를 만들면 나머지 스펙까지
// 두 번씩 돌게 된다.
//
// Playwright의 touchscreen API는 tap만 제공해 드래그를 만들 수 없으므로 TouchEvent를
// 직접 만들어 보낸다.
test.describe('바텀시트 드래그 @integration', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  /** 핸들 위에서 아래로 dy만큼 끈 뒤 last(touchend/touchcancel)로 마무리한다. */
  async function dragHandle(
    page: import('@playwright/test').Page,
    dy: number,
    last: 'touchend' | 'touchcancel',
  ) {
    const sheet = page.getByRole('dialog', { name: '이용약관' });
    const box = (await sheet.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + 14; // 드래그 핸들 영역

    return page.evaluate(
      ([x, y, dy, last]) => {
        const el = document.elementFromPoint(x, y)!;
        const target = document.querySelector('[role=dialog]') as HTMLElement;
        const send = (type: string, cy: number) => {
          const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: cy });
          el.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === 'touchstart' || type === 'touchmove' ? [touch] : [],
              changedTouches: [touch],
            }),
          );
        };
        send('touchstart', y);
        send('touchmove', y + dy);
        // 끄는 동안 시트가 손가락을 따라왔는지 — 핸들러가 실제로 붙어 있었다는 증거다.
        const during = target.style.transform;
        send(last, y + dy);
        return { during, after: target.style.transform };
      },
      [x, y, dy, last] as [number, number, number, string],
    );
  }

  test('핸들을 임계값 이상 끌면 닫힌다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    const { during } = await dragHandle(page, 150, 'touchend');
    expect(during).toBe('translateY(150px)');
    await expect(sheet).toBeHidden();
  });

  test('임계값에 못 미치면 닫히지 않는다', async ({ page }) => {
    const sheet = await openTermsSheet(page);
    const { after } = await dragHandle(page, 20, 'touchend');
    // 인라인 transform이 걷히면 CSS 트랜지션이 제자리로 되돌린다.
    expect(after).toBe('');
    await expect(sheet).toBeVisible();
  });

  test('브라우저가 제스처를 가져가면(touchcancel) 닫지 않고 되돌린다', async ({ page }) => {
    // touchcancel에는 touchend가 뒤따르지 않는다. 여기서 되돌리지 않으면 시트가 끌린
    // 자리에 멈춰, 이후 탭이 엉뚱한 좌표에 떨어진다.
    const sheet = await openTermsSheet(page);
    const { during, after } = await dragHandle(page, 150, 'touchcancel');
    expect(during).toBe('translateY(150px)');
    expect(after).toBe('');
    // 150px는 임계값(80px)을 넘지만, 사용자가 놓은 게 아니라 뺏긴 것이므로 닫지 않는다.
    await expect(sheet).toBeVisible();
  });
});
