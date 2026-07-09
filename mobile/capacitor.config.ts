import { config as loadEnv } from 'dotenv';
import type { CapacitorConfig } from '@capacitor/cli';

// 원격 URL 모드: 로컬 웹 자산을 번들하지 않고 배포된 Next.js(ECS + CloudFront)를
// 웹뷰가 그대로 로드한다. frontend/의 SSR, rewrites 등 서버 기능을 그대로 유지하기 위함.
// MOBILE_APP_URL은 CI(GitHub Actions Repository Variable)에서 `cap sync` 실행 시점에
// 주입한다 — 로컬 개발 시엔 mobile/.env(미커밋)에서 기본값을 읽는다. 셸 환경 변수가
// 이미 있으면 .env보다 우선한다.
loadEnv();
const appUrl = process.env.MOBILE_APP_URL ?? 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'quest.petlog.app',
  appName: 'Petlog',
  webDir: 'www',
  server: {
    url: appUrl,
    cleartext: appUrl.startsWith('http://'),
  },
};

export default config;
