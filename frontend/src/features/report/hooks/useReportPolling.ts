'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { REPORT_POLL_STATUS_QUERY } from '../api/report.queries';
import type { ReportStatus } from '../types/report.types';

const POLL_INTERVAL_MS = 3000;

type TerminalStatus = Extract<ReportStatus, 'completed' | 'failed'>;

export function useReportPolling(
  reportId: string | null,
  onComplete: (status: TerminalStatus) => void,
): void {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const { data, stopPolling } = useQuery(REPORT_POLL_STATUS_QUERY, {
    variables: { id: reportId ?? '' },
    skip: !reportId,
    fetchPolicy: 'network-only',
    pollInterval: reportId ? POLL_INTERVAL_MS : 0,
  });

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!data?.reportPollStatus) return;
    const { status } = data.reportPollStatus;
    if (status === 'completed' || status === 'failed') {
      stopPolling();
      onCompleteRef.current(status);
    }
  }, [data, stopPolling]);
}
