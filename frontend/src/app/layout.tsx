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

// 첫 페인트 전에 <html>에 팔레트와 명암을 심는다. 이걸 ThemeProvider의 useEffect에
// 맡기면 하이드레이션 전까지 기본값(라이트 스카이)으로 한 프레임 그려져 화면이 번쩍인다.
// 다크 사용자에게는 흰 화면이 번쩍이는 셈이라 체감이 특히 나쁘다.
// 키/기본값은 shared/config/theme.ts와 같아야 한다(문자열을 여기서 다시 쓰는 이유는
// 이 스크립트가 번들 밖에서 그대로 실행되기 때문이다).
const THEME_INIT_SCRIPT = `
(function () {
  var d = document.documentElement;
  var stored = { theme: null, mode: null };
  try {
    stored.theme = localStorage.getItem('petlog-theme');
    stored.mode = localStorage.getItem('petlog-theme-mode');
  } catch (e) {
    // 시크릿 모드/서드파티 iframe 등에서 접근이 막히면 저장값 없이 기본값으로 간다.
  }

  d.dataset.theme = stored.theme === 'pastel-pink' ? 'pastel-pink' : 'pastel-sky';

  var mode = stored.mode;
  if (mode !== 'light' && mode !== 'dark') {
    // 기본값은 'system'이다. 저장값을 못 읽었을 때도 라이트로 고정하지 않고
    // OS 설정을 따라야 일관된다.
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  d.dataset.mode = mode;
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 인라인 스크립트가 하이드레이션 전에 <html>의 data-theme/data-mode를 바꾸므로
    // 서버 마크업과 달라진다. 이 엘리먼트에 한해 불일치 경고를 끈다(next-themes와 같은 방식).
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
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
