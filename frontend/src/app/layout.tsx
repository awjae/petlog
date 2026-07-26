// filepath: src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { ApolloProvider } from '@/providers/ApolloProvider';
import { MSWProvider } from '@/providers/MSWProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/config/site';
import { THEME_INIT_SCRIPT } from '@/shared/config/theme';
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
    // suppressHydrationWarning: 아래 THEME_INIT_SCRIPT가 하이드레이션 전에
    // <html>에 data-theme을 붙이므로, 서버 HTML(속성 없음)과 클라이언트 DOM이
    // 이 속성 하나에서 어긋난다. 의도된 차이라 경고만 끈다.
    <html lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
