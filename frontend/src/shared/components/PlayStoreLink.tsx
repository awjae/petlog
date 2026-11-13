'use client';

import { useEffect, useState } from 'react';
import { PLAY_STORE_URL } from '@/shared/config/site';
import { isIOSBrowser, isNativeApp } from '@/shared/native/isNativeApp';

interface PlayStoreLinkProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Android 앱 설치 링크. 앱 안(WebView)에서는 이미 설치한 사람이므로, iOS에서는 설치할
 * 앱이 없으므로 그리지 않는다. 판정이 브라우저 전역에 달려 있어 마운트 후에 결정한다 —
 * 서버 HTML에 넣었다가 지우면 앱 안에서 링크가 한 번 번쩍인다.
 */
export function PlayStoreLink({ className, children }: PlayStoreLinkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isNativeApp() && !isIOSBrowser());
  }, []);

  if (!visible) return null;
  return (
    <a href={PLAY_STORE_URL} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
