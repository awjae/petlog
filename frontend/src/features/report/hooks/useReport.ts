import { useQuery } from '@apollo/client/react';
import { REPORT_QUERY } from '../api/report.queries';
import type { Report } from '../types/report.types';

interface UseReportReturn {
  report: Report | null;
  loading: boolean;
  error: unknown;
}

export function useReport(id: string): UseReportReturn {
  const { data, loading, error } = useQuery(REPORT_QUERY, {
    variables: { id },
    skip: !id,
  });

  return {
    report: data?.report ?? null,
    loading,
    error,
  };
}
