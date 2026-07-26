import { defineConfig } from 'vitest/config';

// 결정 문서: .claude/docs/decisions/013-e2e-vs-frontend-integration-test.md
//
// 이 러너가 맡는 범위는 "순수 함수" 하나뿐이다. 브라우저가 필요한 검증은 전부
// Playwright(integration / e2e)가 이미 담당하므로, 여기에 jsdom이나 렌더링
// 테스트를 들이지 않는다. 그래서 environment도 node 기본값을 그대로 쓴다.
export default defineConfig({
  test: {
    // 기본 include는 e2e/*.spec.ts까지 잡으므로 src 아래 .test.ts로 좁힌다.
    include: ['src/**/*.test.ts'],
  },
});
