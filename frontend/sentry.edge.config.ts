import * as Sentry from '@sentry/nextjs';

// 이 프로젝트는 아직 middleware.ts도, `export const runtime = 'edge'`로 지정한 라우트도
// 없어서 Edge 런타임 자체가 실행되지 않는다 — 즉 지금은 이 파일이 로드될 일이 없는 죽은
// 코드다. @sentry/nextjs 셋업이 기본으로 만들어주는 client/server/edge 3종 세트 중 하나라
// 유지 비용이 거의 없고, 나중에 미들웨어를 추가하면 별도 작업 없이 바로 잡히므로 남겨둔다.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
