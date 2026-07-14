import { defineConfig, devices } from '@playwright/test';

// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//
// - integration: Frontend Integration — 브라우저 내 흐름만 검증, 네트워크는 MSW로 모킹.
//   PR마다 CI에서 실행할 만큼 가볍고 빠르다. 백엔드/DB가 떠 있지 않아도 동작해야 한다.
// - e2e:         UI → 실제 백엔드 → DB 전 구간이 연결되는 인증 흐름 전용.
//   httpOnly 쿠키(Set-Cookie)는 MSW(Service Worker)로 재현 불가능하므로 이 프로젝트만
//   실제 백엔드가 필요하다. 배포 전에만 실행한다.
//
// 두 프로젝트 모두 같은 spec 파일(e2e/flows/*.spec.ts)을 대상으로 하되, 테스트 제목에
// 붙인 @integration / @e2e 태그로 grep 필터링해 분리한다.
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',

  fullyParallel: true,
  // CI에서 test.only가 실수로 남아있으면 빌드를 실패시켜 잡아낸다.
  forbidOnly: !!process.env.CI,
  // 로컬은 실패 즉시 원인을 보는 게 낫고(재시도로 흐려지지 않게), CI는 네트워크/타이밍
  // 이슈로 인한 flake를 흡수하기 위해 2회 재시도한다.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  // e2e 프로젝트의 authenticatedPage/실 계정 시나리오가 쓸 storageState를 준비한다.
  // --project=integration만 실행할 때도 매번 이 스크립트가 돌지만, 내부에서 백엔드
  // 미기동을 감지하면 조용히 스킵하도록 구현했다 (e2e/global-setup.ts 주석 참고).
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  use: {
    baseURL: BASE_URL,
    // 명시적으로 true를 강제하지 않고 undefined로 두면, CI에서는 headless 기본값(true)이
    // 적용되고 로컬에서는 필요할 때 `--headed`/`--debug` CLI 플래그로 눈으로 보며
    // 디버깅할 수 있다. sandbox/서버 환경(디스플레이 없음)에서도 안전하게 항상 headless다.
    headless: process.env.CI ? true : undefined,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'integration',
      grep: /@integration/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      grep: /@e2e/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 프론트/백엔드 dev 서버는 여기서 자동 기동하지 않는다. integration 프로젝트는
  // NEXT_PUBLIC_USE_MOCK=true로 띄운 프론트만 있으면 되고, e2e 프로젝트는 추가로
  // 실제 백엔드+DB(마이그레이션 완료 상태)가 필요해 Playwright webServer로 안전하게
  // 자동화하기 어렵다(마이그레이션/시드 타이밍을 보장 못함). 대신 실행 전 사용자가
  // 직접 두 서버를 띄우는 것을 전제로 한다 — 자세한 안내는 작업 보고 참고.
});
