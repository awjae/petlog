import { request } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//
// 여기서 만드는 storageState(.auth/user.json)는 "이미 로그인된 상태"가 필요한
// Frontend Integration 테스트(e2e/fixtures/auth.ts의 authenticatedPage 픽스처)를
// 위한 시드 계정이다.
//
// 반대로 e2e/flows/auth.spec.ts(@e2e)의 4개 시나리오는 로그인/로그아웃/보호 경로
// 리다이렉트 "그 자체"가 검증 대상이라 이 storageState를 절대 공유하지 않는다 —
// 각 시나리오가 자기 계정을 직접 만들고(email에 타임스탬프를 넣어 유니크하게),
// RTR(Refresh Token Rotation) 로직이 시나리오 실행 순서에 따라 서로 간섭하지
// 않도록 독립적으로 실행된다.
const AUTH_FILE = path.join(__dirname, '.auth/user.json');
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const SEED_PASSWORD = 'e2e-seed-password-1234';

export default async function globalSetup(): Promise<void> {
  const email = `e2e+seed-${Date.now()}@petlog.test`;
  const context = await request.newContext({ baseURL: BASE_URL });

  try {
    // register는 성공 시 auth.controller.ts가 즉시 access/refresh 쿠키를 심어준다
    // (회원가입 = 자동 로그인)이므로 별도로 /auth/login을 호출할 필요가 없다.
    const res = await context.post('/api/auth/register', {
      data: {
        email,
        password: SEED_PASSWORD,
        consents: { termsOfService: true, privacyPolicy: true, marketingNotification: false },
      },
    });

    if (!res.ok()) {
      // --project=integration만 실행하는 경우(MSW 기반, 백엔드 불필요) 백엔드가
      // 떠 있지 않을 수 있다. 이때 전체 테스트 런을 죽이면 Frontend Integration의
      // "빠르고 DB 없이 실행된다"는 설계 의도가 깨지므로, 경고만 남기고 넘어간다.
      // --project=e2e를 실제로 돌리려는 사용자는 이 경고를 보고 백엔드를 먼저 띄우면 된다.
      console.warn(
        `[e2e/global-setup] 회원가입 요청이 실패했습니다 (status ${res.status()}). ` +
          `--project=e2e를 실행하려면 실제 백엔드(npm run dev:backend)와 DB(npm run db:up)가 ` +
          `먼저 떠 있어야 합니다. --project=integration만 실행 중이라면 이 경고는 무시해도 됩니다.`,
      );
      return;
    }

    await mkdir(path.dirname(AUTH_FILE), { recursive: true });
    await context.storageState({ path: AUTH_FILE });
  } catch (err) {
    // 백엔드 자체가 기동돼 있지 않아 연결이 거부되는 경우(ECONNREFUSED 등)도 위와
    // 동일한 이유로 전체 런을 죽이지 않는다.
    console.warn(
      `[e2e/global-setup] 백엔드(${BASE_URL})에 연결할 수 없어 시드 계정 생성을 건너뜁니다:`,
      err instanceof Error ? err.message : err,
    );
  } finally {
    await context.dispose();
  }
}
