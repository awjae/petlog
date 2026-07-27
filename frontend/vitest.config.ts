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
    // 타임존은 여기서 고정한다. npm 스크립트에 TZ=... 를 쓰면 Windows에서 깨지고,
    // 러너를 직접 실행할 때(IDE 통합 등) 빠진다. 이 로직들의 본질이 "UTC 문자열을
    // 로컬 날짜로 접는 것"이라 타임존이 흔들리면 검증이 무의미해진다.
    env: { TZ: 'Asia/Seoul' },
  },
});
