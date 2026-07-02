'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { REPORT_PERIOD_PREVIEW_QUERY } from '../api/report.queries';
import type { ReportPeriodPreviewResult } from '../types/report.types';
import { toEndOfDayIso, toStartOfDayIso } from '../utils/reportPeriod';

const DEBOUNCE_MS = 300;

interface UseReportPeriodPreviewOptions {
  skip?: boolean;
  // true면 300ms 디바운스 후 조회(커스텀 날짜 선택), false면 즉시 조회(프리셋 선택/최초 진입)
  debounce?: boolean;
}

interface UseReportPeriodPreviewReturn {
  preview: ReportPeriodPreviewResult | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useReportPeriodPreview(
  petId: string,
  periodStart: string,
  periodEnd: string,
  { skip = false, debounce = false }: UseReportPeriodPreviewOptions = {},
): UseReportPeriodPreviewReturn {
  const [queried, setQueried] = useState({ periodStart, periodEnd });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!debounce) {
      clearTimeout(timerRef.current);
      setQueried({ periodStart, periodEnd });
      return;
    }
    timerRef.current = setTimeout(() => {
      setQueried({ periodStart, periodEnd });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [periodStart, periodEnd, debounce]);

  const isPending = queried.periodStart !== periodStart || queried.periodEnd !== periodEnd;

  const { data, loading, error, refetch } = useQuery(REPORT_PERIOD_PREVIEW_QUERY, {
    variables: {
      petId,
      periodStart: queried.periodStart ? toStartOfDayIso(queried.periodStart) : '',
      periodEnd: queried.periodEnd ? toEndOfDayIso(queried.periodEnd) : '',
    },
    skip: skip || !petId || !queried.periodStart || !queried.periodEnd,
    fetchPolicy: 'network-only',
  });

  return {
    preview: data?.reportPeriodPreview ?? null,
    loading: loading || isPending,
    error,
    refetch,
  };
}
