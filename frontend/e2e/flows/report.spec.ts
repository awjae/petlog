// Frontend Integration(@integration) — AI 리포트.
// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//
// ── authenticatedPage 픽스처를 쓰지 않는 이유 (실제로 서버를 띄워 확인한 결과) ──
//
// 013 문서는 "전용 라우트 가드 파일은 없고, GraphQL 쿼리가 UNAUTHENTICATED로 실패해야만
// errorLink.ts가 반응하는 조건부 보호"라고 적혀 있다(2026-07-14 기준). 이번 작업에서
// `NEXT_PUBLIC_USE_MOCK=true`로 실제 프론트를 띄워 /reports에 접근해보니 이 설명은 더 이상
// 정확하지 않다 — 그 사이 `frontend/src/proxy.ts`(Next.js 16의 middleware.ts 대응 파일,
// `export function proxy()`)가 추가되어 있었다:
//
//   const PROTECTED_PREFIXES = ['/home', '/pets', '/records', '/reports', '/settings'];
//   const hasToken = request.cookies.has('access_token');
//   if (!hasToken && isProtected) return NextResponse.redirect(new URL('/login', request.url));
//
// 이건 클라이언트 JS(따라서 MSW)가 실행되기 전에 서버 엣지에서 도는 진짜 라우트 가드다.
// 쿠키가 없으면 React가 마운트되기도 전에 /login으로 307 리다이렉트된다 — 직접 curl로
// 확인(`HTTP/1.1 307 Temporary Redirect`, `location: /login`). 즉 013 문서를 이 부분만큼은
// 갱신해야 한다(별도로 짧은 addendum을 남겼다).
//
// 다만 이 가드는 `request.cookies.has('access_token')`로 "존재 여부"만 검사하고 JWT
// 서명/만료는 검증하지 않는다 — 실제 검증(GqlAuthGuard)은 그 다음 GraphQL 요청이 백엔드에
// 도달했을 때 일어나는데, 이 요청 자체를 MSW가 통째로 가로챈다. 그래서 백엔드가 발급한
// "진짜" 쿠키(authenticatedPage 픽스처 → e2e/global-setup.ts → 실제 백엔드 회원가입)가
// 없어도, 이름만 같은 더미 쿠키(`access_token`, 값은 아무 문자열)를 브라우저에 심어두면
// 엣지 가드를 통과하고 그 뒤로는 전부 MSW가 응답한다. 쿠키 이름은 실제 발급 값과 맞춰뒀다
// (`backend/src/auth/auth.controller.ts`의 `ACCESS_COOKIE = 'access_token'`).
//
// 이 방식이 authenticatedPage(실제 백엔드 필요)보다 나은 이유:
// - integration 프로젝트는 "백엔드 없이 동작해야 한다"가 원칙(playwright.config.ts 주석).
//   authenticatedPage는 e2e/global-setup.ts가 실제 백엔드 회원가입에 성공해야만
//   e2e/.auth/user.json을 만드는데, 백엔드가 안 떠 있으면 파일 자체가 없어 컨텍스트 생성이
//   실패한다 — 이 취약점이 이번 조사 전까지 한 번도 실행되지 않아(전부 test.skip) 드러나지
//   않았었다.
// - 더미 쿠키 접근은 그 취약점 없이도 동일한 목적(엣지 가드 통과)을 달성한다.
//
// 따라서 이 파일은 e2e/fixtures/auth.ts 대신 @playwright/test의 기본 test/expect를 쓰고,
// beforeEach에서 더미 access_token 쿠키만 직접 심는다.
//
// 시나리오 전환은 frontend/src/mocks/handlers/report.ts가 읽는 ?mockScenario= 쿼리
// 파라미터로 한다 (worker.use() 런타임 override 대신 — 이유는 해당 파일 상단 주석 참고).

import { test, expect } from '@playwright/test';

test.describe('AI 리포트 @integration', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // frontend/src/proxy.ts의 엣지 라우트 가드(access_token 쿠키 존재 여부만 검사)를
    // 통과시키기 위한 더미 쿠키. 실제 백엔드 발급 쿠키가 아니어도, 이후 모든 GraphQL
    // 요청은 MSW가 가로채므로 서명 검증까지 갈 일이 없다.
    //
    // 쿠키의 url은 반드시 Playwright가 실제 내비게이션에 쓰는 baseURL과 같아야 한다
    // (project/CLI에서 override 가능) — 별도 상수로 계산하면 두 값이 어긋날 때 쿠키가
    // 다른 origin에 심어져 엣지 가드를 통과하지 못한다.
    const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000';
    await page.context().addCookies([
      {
        name: 'access_token',
        value: 'mock-access-token-for-integration-test',
        url: baseURL,
      },
    ]);
  });

  test('happy path: 기간 선택 후 생성 → 로딩 → 결과 노출', async ({ page }) => {
    await page.goto('/reports');

    // Given — 기록이 충분해 리포트를 생성할 수 있는 상태
    const panel = page.getByTestId('report-panel');
    await expect(panel).toHaveAttribute('data-report-state', 'ready');
    const openSheetButton = page.getByRole('button', { name: 'AI 리포트 만들기' });
    await expect(openSheetButton).toBeVisible();

    // When — 기간 선택 바텀시트를 열고 프리셋을 고른 뒤 생성 요청
    await openSheetButton.click();
    const sheet = page.getByRole('dialog', { name: '리포트 기간 선택' });
    await expect(sheet).toBeVisible();

    await sheet.getByRole('button', { name: '최근 7일' }).click();
    const submitButton = sheet.getByRole('button', { name: '이 기간으로 리포트 생성하기' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Then — 로딩 상태를 거쳐 결과가 노출된다
    await expect(panel).toHaveAttribute('data-report-state', 'polling');
    await expect(page.getByText('리포트를 분석 중이에요')).toBeVisible();

    // 두 번째 폴링(약 3초 후)에 완료 상태가 오므로 넉넉한 타임아웃을 준다
    await expect(page.getByRole('status')).toHaveText('리포트가 완성됐어요', { timeout: 8000 });
    await expect(panel).toHaveAttribute('data-report-state', 'limit-reached');
    await expect(page.getByText('이번 달 리포트를 이미 생성했어요')).toBeVisible();

    const pastReportsSection = page.getByRole('region', { name: '지난 리포트' });
    await expect(pastReportsSection).toBeVisible();
    await expect(pastReportsSection.getByRole('link')).toBeVisible();
  });

  test('empty state: 최소 기록 조건 미충족 시 생성 불가 안내', async ({ page }) => {
    await page.goto('/reports?mockScenario=insufficient');

    const panel = page.getByTestId('report-panel');
    await expect(panel).toHaveAttribute('data-report-state', 'insufficient');
    await expect(page.getByText('기록이 쌓이면 AI가 건강 변화를 분석해드려요.')).toBeVisible();

    // 최소 기준(10건/7일) 대비 현재 기록(3건/2일)이 진행률로 노출된다
    // (aria-label이 form control이 아닌 일반 div에 붙어 있어 getByLabel 대신 속성으로 조회)
    await expect(page.locator('[aria-label="기록 수: 3 / 10건"]')).toBeVisible();
    await expect(page.locator('[aria-label="기록 기간: 2 / 7일"]')).toBeVisible();

    // 생성 CTA는 아예 노출되지 않는다
    await expect(page.getByRole('button', { name: 'AI 리포트 만들기' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '지금 기록하러 가기' })).toBeVisible();
  });

  test('error state: 생성 실패 시 에러 상태 노출', async ({ page }) => {
    await page.goto('/reports?mockScenario=generate-failed');

    const panel = page.getByTestId('report-panel');
    await expect(panel).toHaveAttribute('data-report-state', 'ready');

    await page.getByRole('button', { name: 'AI 리포트 만들기' }).click();
    const sheet = page.getByRole('dialog', { name: '리포트 기간 선택' });
    await expect(sheet).toBeVisible();

    await sheet.getByRole('button', { name: '최근 7일' }).click();
    const submitButton = sheet.getByRole('button', { name: '이 기간으로 리포트 생성하기' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 폴링 결과가 실패로 돌아오면 에러 토스트가 뜨고, 다시 생성 가능한 상태로 복귀한다
    // (두 번째 폴링(약 3초 후)에 실패 상태가 오므로 넉넉한 타임아웃을 준다)
    await expect(page.getByRole('status')).toHaveText(
      '리포트 생성에 실패했어요. 다시 시도해주세요.',
      { timeout: 8000 },
    );
    await expect(panel).toHaveAttribute('data-report-state', 'ready');
    await expect(page.getByRole('button', { name: 'AI 리포트 만들기' })).toBeVisible();
  });
});
