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
    startMSW().then(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
