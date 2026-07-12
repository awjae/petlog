// filepath: src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { ApolloProvider } from '@/providers/ApolloProvider';
import { MSWProvider } from '@/providers/MSWProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  verification: {
    other: {
      'naver-site-verification': 'f2d8a6a3429f8bb20c4820d9304237a2cb104caf',
    },
  },
};

// viewport-fit=cover: 웹뷰가 상단 카메라(펀치홀)/노치 영역까지 화면을 그리게 하고,
// 대신 env(safe-area-inset-*)로 실제 인셋 값을 받아 각 페이지에서 패딩으로 보정한다.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          <MSWProvider>
            <ApolloProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </ApolloProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
