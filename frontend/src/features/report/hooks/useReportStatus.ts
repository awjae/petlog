import { useQuery } from '@apollo/client/react';
import { REPORT_STATUS_QUERY } from '../api/report.queries';
import type { ReportStatusResult } from '../types/report.types';

interface UseReportStatusReturn {
  status: ReportStatusResult | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useReportStatus(petId: string): UseReportStatusReturn {
  const { data, loading, error, refetch } = useQuery(REPORT_STATUS_QUERY, {
    variables: { petId },
    skip: !petId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    status: data?.reportStatus ?? null,
    loading,
    error,
    refetch,
  };
}
