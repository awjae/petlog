import { useQuery } from '@apollo/client/react';
import { HEALTH_RECORDS_QUERY } from '../api/health-record.queries';

export function useHealthRecords(petId: string) {
  const { data, loading, error, refetch } = useQuery(HEALTH_RECORDS_QUERY, {
    variables: { petId },
    skip: !petId,
  });

  return {
    records: data?.healthRecords ?? [],
    loading,
    error,
    refetch,
  };
}
