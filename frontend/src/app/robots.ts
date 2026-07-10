// filepath: src/app/robots.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // 비공개(인증 필요) 라우트
        '/home',
        '/pets',
        '/pets/*',
        '/records',
        '/records/*',
        '/reports',
        '/reports/*',
        '/settings',
        '/settings/*',
        // 공개이지만 색인 가치가 없거나 민감한 라우트
        // (특히 /reset-password는 ?token= 쿼리로 재설정 토큰이 노출되므로 색인 금지)
        '/forgot-password',
        '/reset-password',
        // API 라우트
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
