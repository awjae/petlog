import { useQuery } from '@apollo/client/react';
import { REPORTS_QUERY } from '../api/report.queries';
import type { Report } from '../types/report.types';

interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useReports(petId: string): UseReportsReturn {
  const { data, loading, error, refetch } = useQuery(REPORTS_QUERY, {
    variables: { petId },
    skip: !petId,
    fetchPolicy: 'cache-and-network',
  });

  const completedReports = (data?.reports ?? []).filter((r) => r.status === 'completed');

  return {
    reports: completedReports,
    loading,
    error,
    refetch,
  };
}
