import { useQuery } from '@apollo/client/react';
import type { HealthRecordType } from '@/generated/graphql';
import { HEALTH_RECORDS_QUERY } from '../api/health-record.queries';

// type·limit을 생략하면 반려동물의 기록 전체를 가져온다(타임라인).
export function useHealthRecords(
  petId: string,
  filter: { type?: HealthRecordType; limit?: number } = {},
) {
  const { data, loading, error, refetch } = useQuery(HEALTH_RECORDS_QUERY, {
    variables: { petId, ...filter },
    skip: !petId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    records: data?.healthRecords ?? [],
    loading,
    error,
    refetch,
  };
}
