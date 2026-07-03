'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { StatusPage } from '@/shared/components/StatusPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="문제가 발생했어요"
      description="일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요."
      action={{ label: '다시 시도', onClick: reset }}
    />
  );
}
