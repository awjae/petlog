// filepath: src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/config/site';

// 공개(색인 대상) 라우트만 등록한다. 인증이 필요한 라우트와
// /forgot-password, /reset-password는 robots.ts에서 별도로 색인 제외한다.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1 },
    { path: '/login', priority: 0.6 },
    { path: '/register', priority: 0.6 },
    { path: '/privacy', priority: 0.3 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    priority,
  }));
}
