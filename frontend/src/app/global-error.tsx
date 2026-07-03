'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { StatusPage } from '@/shared/components/StatusPage';
import './globals.css';

// 루트 레이아웃(Provider 포함) 자체가 크래시났을 때만 렌더링되는 최후의 fallback이라
// html/body를 직접 정의해야 한다.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <StatusPage
          code="500"
          title="문제가 발생했어요"
          description="일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요."
          action={{ label: '홈으로', href: '/home' }}
        />
      </body>
    </html>
  );
}
