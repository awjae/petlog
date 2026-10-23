'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// 가입 이전 유입 퍼널(가이드 글 → 가입)을 보기 위한 방문 기록. 로그인 후 화면은 세지 않는다.
const PUBLIC_PATH = /^\/(guides(\/.*)?|sample-report|login|register)?$/;

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
    if (!PUBLIC_PATH.test(pathname)) return;
    try {
      // 새로고침·뒤로가기로 같은 탭에서 같은 경로가 중복 집계되지 않게 한다.
      const key = `petlog-visit:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      const utmSource = new URLSearchParams(location.search).get('utm_source') ?? undefined;
      const body = JSON.stringify({ path: pathname, referrer: referrerHost(), utmSource });
      navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }));
    } catch {
      // 계측 실패가 화면에 영향을 주면 안 된다.
    }
  }, [pathname]);

  return null;
}
