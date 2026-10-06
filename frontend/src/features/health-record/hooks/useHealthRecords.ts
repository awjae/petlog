import { useQuery } from '@apollo/client/react';
import { HEALTH_RECORDS_QUERY } from '../api/health-record.queries';

// 반려동물의 기록 전체. 타임라인·그래프·내보내기가 같은 쿼리 변수로 Apollo 캐시를 공유한다.
export function useHealthRecords(petId: string) {
  const { data, loading, error, refetch } = useQuery(HEALTH_RECORDS_QUERY, {
    variables: { petId },
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
