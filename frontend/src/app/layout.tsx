// filepath: src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { ApolloProvider } from '@/providers/ApolloProvider';
import { MSWProvider } from '@/providers/MSWProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Petlog',
  description: '반려동물 건강 기록 서비스',
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
            <ApolloProvider>{children}</ApolloProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
