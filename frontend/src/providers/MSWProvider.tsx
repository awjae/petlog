'use client';

import { type ReactNode, useEffect, useState } from 'react';

const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

async function startMSW() {
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isMock);

  useEffect(() => {
    if (!isMock) {
      setReady(true);
      return;
    }
    // 워커 등록이 막히면(Playwright serviceWorkers: 'block' 등) start()가 reject한다.
    // 그때 ready를 false로 두면 화면이 통째로 비므로, 실패해도 실제 네트워크로 흘려보낸다.
    startMSW().finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
