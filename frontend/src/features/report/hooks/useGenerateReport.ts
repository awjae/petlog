'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { GENERATE_REPORT_MUTATION } from '../api/report.mutations';
import type { ReportType } from '../types/report.types';

interface UseGenerateReportReturn {
  generateReport: (petId: string, type?: ReportType) => Promise<string | null>;
  loading: boolean;
  error: string;
}

export function useGenerateReport(): UseGenerateReportReturn {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(GENERATE_REPORT_MUTATION, {
    onError: () => setError('리포트 생성에 실패했어요. 다시 시도해주세요.'),
  });

  async function generateReport(
    petId: string,
    type: ReportType = 'monthly',
  ): Promise<string | null> {
    setError('');
    const result = await mutate({ variables: { petId, type } }).catch(() => null);
    return result?.data?.generateReport.reportId ?? null;
  }

  return { generateReport, loading, error };
}
