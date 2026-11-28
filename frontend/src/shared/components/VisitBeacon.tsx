'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { rememberFirstTouch } from '@/shared/utils/firstTouch';
import { toVisitPath } from '@/shared/utils/visitPath';

function referrerHost(): string | undefined {
  try {
    const host = document.referrer ? new URL(document.referrer).host : '';
    return host && host !== location.host ? host : undefined;
  } catch {
    return undefined;
  }
}

export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const path = toVisitPath(pathname);
    if (!path) return;
    const utmSource = new URLSearchParams(location.search).get('utm_source') ?? undefined;
    const referrer = referrerHost();
    rememberFirstTouch({ landingPath: path, referrer, utmSource });
    try {
      // 새로고침·뒤로가기로 같은 탭에서 같은 경로가 중복 집계되지 않게 한다.
      const key = `petlog-visit:${path}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      const body = JSON.stringify({ path, referrer, utmSource });
      navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }));
    } catch {
      // 계측 실패가 화면에 영향을 주면 안 된다.
    }
  }, [pathname]);

  return null;
}
