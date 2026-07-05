import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  // AWS App Runner 컨테이너 배포를 위한 standalone 빌드.
  // .next/standalone 에 실행에 필요한 최소 node_modules와 server.js가 생성된다.
  output: 'standalone',
  async rewrites() {
    if (!apiUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

// SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN이 없으면
// 소스맵 업로드만 비활성화되고 빌드는 정상 진행된다.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
