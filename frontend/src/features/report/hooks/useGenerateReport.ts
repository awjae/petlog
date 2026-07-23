'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { GENERATE_REPORT_MUTATION } from '../api/report.mutations';
import { extractGenerateReportErrorMessage } from '../api/report.errors';

interface UseGenerateReportReturn {
  generateReport: (petId: string, periodStart: string, periodEnd: string) => Promise<string | null>;
  loading: boolean;
  error: string;
}

export function useGenerateReport(): UseGenerateReportReturn {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(GENERATE_REPORT_MUTATION);

  async function generateReport(
    petId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<string | null> {
    setError('');
    try {
      const result = await mutate({ variables: { petId, periodStart, periodEnd } });
      return result.data?.generateReport.reportId ?? null;
    } catch (err) {
      setError(extractGenerateReportErrorMessage(err));
      return null;
    }
  }

  return { generateReport, loading, error };
}
