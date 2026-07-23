import * as Sentry from '@sentry/node';

// SENTRY_DSN이 배포 환경(ECS)에서만 주입되고 로컬 .env.example에는 빈 값으로 남아있으므로,
// 로컬 개발에서는 자동으로 비활성화된다 (frontend의 sentry.server.config.ts와 동일한 패턴).
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
