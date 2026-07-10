// filepath: src/app/manifest.ts
//
// 웹 매니페스트. Capacitor 기반 모바일 앱(mobile/)과는 별개로,
// 브라우저에서 접근하는 웹 버전을 위한 최소한의 PWA 메타데이터만 정의한다.
import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/shared/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: '반려동물 건강 기록과 AI 건강 리포트 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f0e6',
    theme_color: '#6baed6',
    icons: [
      {
        src: '/main-logo.png',
        sizes: '256x256',
        type: 'image/png',
      },
    ],
  };
}
