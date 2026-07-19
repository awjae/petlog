'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchPublicSharedReport,
  PublicReportShareError,
  type PublicReportShareErrorKind,
} from '../api/reportSharePublic.api';
import type { PublicSharedReport } from '../types/report-share.types';

interface UsePublicSharedReportReturn {
  report: PublicSharedReport | null;
  loading: boolean;
  errorKind: PublicReportShareErrorKind | null;
  refetch: () => void;
}

export function usePublicSharedReport(token: string): UsePublicSharedReportReturn {
  const [report, setReport] = useState<PublicSharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<PublicReportShareErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorKind(null);

    fetchPublicSharedReport(token)
      .then((result) => {
        if (cancelled) return;
        setReport(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReport(null);
        setErrorKind(err instanceof PublicReportShareError ? err.kind : 'network');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  return { report, loading, errorKind, refetch };
}
