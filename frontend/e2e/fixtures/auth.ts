import { test as base, expect, type Page } from '@playwright/test';
import path from 'node:path';

// e2e/global-setup.ts가 실제 백엔드에 회원가입해 저장해둔 storageState를 재사용한다.
// httpOnly 쿠키를 MSW로는 심을 수 없으므로, 이 쿠키는 반드시 global-setup에서
// "실제 백엔드"를 통해 획득된 것이어야 한다 — 이 파일 자체는 네트워크를 만들지 않는다.
//
// 용도: Frontend Integration(@integration) 테스트에서 로그인 화면을 거치지 않고
// 바로 "이미 인증된 상태"에서 화면 흐름을 검증하고 싶을 때 사용한다.
// (예: e2e/flows/home.spec.ts, pet.spec.ts 등 — 실제 구현은 다음 단계)
//
// 주의: e2e/flows/auth.spec.ts(@e2e)는 로그인/로그아웃 자체가 검증 대상이므로
// 이 픽스처를 사용하지 않는다 — 시나리오별로 독립된 계정을 직접 만든다.
const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
