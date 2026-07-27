import { config as loadEnv } from 'dotenv';
import type { CapacitorConfig } from '@capacitor/cli';

// 원격 URL 모드: 로컬 웹 자산을 번들하지 않고 배포된 Next.js(ECS + CloudFront)를
// 웹뷰가 그대로 로드한다. frontend/의 SSR, rewrites 등 서버 기능을 그대로 유지하기 위함.
//
// 이 선택의 대가 — 오프라인 지원을 검토할 때 먼저 읽을 것:
// 1. 서비스워커가 없으므로 오프라인에서 앱 셸이 뜬다는 보장이 없다. "오프라인에 쌓았다가
//    나중에 보내는" 기능은 이 위에 얹을 수 없다.
// 2. 로컬 번들 모드로 바꾸면 origin이 capacitor:// 계열로 바뀐다. 지금 API 호출은 상대
//    경로 /api/graphql + credentials:'include'이고 인증이 httpOnly 쿠키라, origin이
//    달라지면 rewrite도 쿠키 전송도 성립하지 않는다 — 인증 전체를 다시 설계해야 한다.
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
