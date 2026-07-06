import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// 반려동물 이미지가 저장된 CloudFront 배포 도메인 (backend-stack.ts가 백엔드 컨테이너에
// 주입하는 AWS_CLOUDFRONT_DOMAIN과 동일한 값). next/image는 remotePatterns에 없는
// 외부 호스트를 400으로 거부하므로, 실제 이미지 호스트를 명시적으로 허용해야 한다.
// standalone 빌드는 next.config.ts를 런타임에 다시 require하므로(빌드 타임이 아니라
// 컨테이너 시작 시점의 process.env를 읽음), ECS 태스크 정의의 런타임 환경변수로 주입한다
// (NEXT_PUBLIC_API_URL처럼 빌드 시점 --build-arg가 필요 없다).
const cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;

const nextConfig: NextConfig = {
  // AWS ECS Fargate 컨테이너 배포를 위한 standalone 빌드.
  // .next/standalone 에 실행에 필요한 최소 node_modules와 server.js가 생성된다.
  output: 'standalone',
  images: {
    remotePatterns: cloudfrontDomain
      ? [
          {
            protocol: 'https',
            hostname: cloudfrontDomain,
            pathname: '/**',
          },
        ]
      : [],
  },
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
