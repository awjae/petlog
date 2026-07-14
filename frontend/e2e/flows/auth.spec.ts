import { test, expect } from '@playwright/test';

// @e2e — 실제 백엔드 + DB 연결. httpOnly 쿠키(Set-Cookie)는 MSW로 재현할 수 없어
// (.claude/docs/decisions/013-e2e-vs-frontend-integration-test.md) 인증 흐름만은
// 이 프로젝트로 분리했다. 실행 전 실제 백엔드(npm run dev:backend)와
// DB(npm run db:up, 마이그레이션 완료)가 떠 있어야 한다.
//
// 계정 전략: 고정 테스트 계정을 재사용하지 않는다. RTR(Refresh Token Rotation)은
// 재사용 감지 시 해당 유저의 세션을 전부 폐기하므로, 계정을 공유하면 시나리오
// 실행 순서/병렬 실행에 따라 서로의 세션을 깨뜨릴 수 있다. 대신 시나리오마다
// `POST /api/auth/register`로 유니크한 이메일의 신규 계정을 만들어 쓰고,
// 끝나면 `POST /api/auth/withdraw`(소프트 삭제, 30일 그레이스)로 정리한다.
// storageState도 공유하지 않는다 — e2e/fixtures/auth.ts의 authenticatedPage
// 픽스처는 Frontend Integration 테스트 전용이다.
const TEST_PASSWORD = 'e2e-test-password-1234';

function uniqueEmail(scenario: string): string {
  return `e2e+${scenario}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@petlog.test`;
}

test.describe('인증 흐름 @e2e', () => {
  test('로그인 → 홈 이동 + 쿠키 실제 설정 확인', async ({ page, request }) => {
    const email = uniqueEmail('login');

    // 이 시나리오는 "로그인 폼 제출"이 실제로 쿠키를 심는지 검증하는 게 목적이므로,
    // 계정 생성은 브라우저 쿠키와 무관한 독립 request 컨텍스트(API 전용)로 미리
    // 해둔다. context.request가 아니라 request 픽스처를 쓰는 이유는, register가
    // 자동으로 로그인 쿠키를 심어주는데(auth.controller.ts) 그 쿠키가 이 테스트의
    // page 컨텍스트에 섞여 들어가면 "로그인 버튼을 눌러서 쿠키가 생겼다"는 인과관계를
    // 더 이상 확신할 수 없기 때문이다.
    const setupRes = await request.post('/api/auth/register', {
      data: { email, password: TEST_PASSWORD },
    });
    expect(setupRes.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    await page.waitForURL('**/home');
    await expect(page.getByRole('main', { name: '홈' })).toBeVisible();

    const cookies = await page.context().cookies();
    const accessCookie = cookies.find((c) => c.name === 'access_token');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');

    // httpOnly 여부까지 확인한다 — Petlog 인증의 핵심 전제(JS에서 접근 불가)가
    // 실제로 지켜지는지는 MSW로는 절대 검증할 수 없는 지점이라 E2E에서만 의미가 있다.
    expect(accessCookie, 'access_token 쿠키가 설정돼야 한다').toBeDefined();
    expect(accessCookie?.httpOnly).toBe(true);
    expect(refreshCookie, 'refresh_token 쿠키가 설정돼야 한다').toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);

    // 정리: 로그인된 브라우저 컨텍스트의 쿠키를 그대로 사용해 탈퇴 처리한다.
    await page.context().request.post('/api/auth/withdraw', {
      data: { password: TEST_PASSWORD },
    });
  });

  test('미인증 상태로 보호 경로 접근 시 로그인 화면으로 리다이렉트', async ({ page }) => {
    // 쿠키가 전혀 없는 기본 page(테스트마다 새 브라우저 컨텍스트)로 보호 경로에
    // 바로 진입한다. 이 테스트는 계정을 만들 필요가 없다.
    //
    // 실제 가드 위치 확인(추측 아님): frontend/src/app 및 frontend/src에
    // middleware.ts가 존재하지 않음을 직접 확인했다. Petlog에는 Next.js
    // 라우트 레벨 가드가 없고, 대신 "리액티브" 가드 구조다:
    //   1) /home의 useHomeData가 GraphQL HOME_QUERY를 실행
    //   2) 인증 쿠키가 없어 GqlAuthGuard가 UNAUTHENTICATED로 응답
    //      (HTTP 200 + errors[].extensions.code === 'UNAUTHENTICATED', GraphQL 스펙상 정상)
    //   3) frontend/src/lib/apollo/links/errorLink.ts가 이를 감지해 POST /auth/refresh 시도
    //   4) refresh_token 쿠키도 없어 JwtRefreshGuard가 401을 반환
    //   5) errorLink.ts가 window.location.href = '/login'으로 전체 페이지 리다이렉트
    // 즉 리다이렉트는 "네비게이션 시점"이 아니라 "첫 인증 필요 API 호출이 실패하는
    // 시점"에 일어난다 — 그래서 즉시가 아니라 waitForURL로 기다린다.
    await page.goto('/home');

    await page.waitForURL('**/login');
    await expect(page.getByRole('main', { name: '로그인' })).toBeVisible();
  });

  test('회원가입 완료 → 반려동물 등록 화면 이동', async ({ page }) => {
    const email = uniqueEmail('register');

    await page.goto('/register');
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('비밀번호 확인').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '회원가입' }).click();

    // RegisterPageClient는 성공 시 항상 /home으로 보낸다(온보딩 노출 여부는
    // OnboardingOverlay가 클라이언트에서 스스로 판단).
    await page.waitForURL('**/home');

    // 신규 계정은 최초 로그인이라 OnboardingOverlay가 /home 마운트 시 즉시 뜬다
    // (배경 탭으로는 안 닫히고 포인터 이벤트를 흡수하므로, CTA를 누르기 전에 명시적으로
    // 닫기 버튼을 눌러 치워야 한다).
    await page.getByRole('button', { name: '온보딩 닫기' }).click();

    // 신규 계정은 반려동물이 0개이므로 HomeNoPetContent가 렌더링되고, 그 안의
    // CTA 링크(href="/pets/new")를 눌러 등록 화면으로 이동한다.
    await page.getByRole('link', { name: '반려동물 등록하기' }).click();

    await page.waitForURL('**/pets/new');
    await expect(page.getByRole('heading', { name: '반려동물 등록' })).toBeVisible();

    await page.context().request.post('/api/auth/withdraw', {
      data: { password: TEST_PASSWORD },
    });
  });

  test('로그아웃 → 쿠키 삭제 확인 + 보호 경로 리다이렉트', async ({ page, context }) => {
    const email = uniqueEmail('logout');

    // context.request로 회원가입하면 응답의 Set-Cookie가 이 브라우저 컨텍스트에
    // 그대로 반영된다(page와 context.request는 쿠키 저장소를 공유한다) — 로그아웃
    // 자체가 검증 대상인 시나리오라 로그인 폼을 다시 거칠 필요가 없어 이 방식을 쓴다.
    const setupRes = await context.request.post('/api/auth/register', {
      data: { email, password: TEST_PASSWORD },
    });
    expect(setupRes.ok()).toBeTruthy();

    await page.goto('/settings');
    await expect(page.getByRole('main', { name: '설정' })).toBeVisible();

    await page.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL('**/login');

    const cookiesAfterLogout = await context.cookies();
    expect(cookiesAfterLogout.find((c) => c.name === 'access_token')).toBeUndefined();
    expect(cookiesAfterLogout.find((c) => c.name === 'refresh_token')).toBeUndefined();

    // 세션이 끊겼으니 보호 경로는 다시 로그인으로 리다이렉트돼야 한다
    // (위 시나리오와 동일한 리액티브 가드 경로).
    await page.goto('/home');
    await page.waitForURL('**/login');

    // 참고: 이 시나리오는 "로그아웃으로 세션이 끊기는 것" 자체가 검증 대상이라,
    // 끝난 시점엔 이미 인증 쿠키가 없어 /auth/withdraw를 호출할 수 없다. 이 테스트
    // 계정은 로컬/개발 DB에 정리되지 않은 상태로 남는데, 1인 개발 단계의 로컬 DB
    // 기준으로는 감수 가능한 수준으로 판단했다. 누적이 걱정되면 이메일 접두사
    // `e2e+`로 일괄 정리하는 global-teardown.ts를 별도로 추가하는 걸 고려할 것.
  });
});
