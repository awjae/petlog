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

test.describe('바텀시트 @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

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
