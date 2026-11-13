import { useMutation } from '@apollo/client/react';
import { DELETE_HEALTH_RECORD_MUTATION } from '../api/health-record.mutations';

// 기록 삭제. 잘못 입력한 기록(예: 4.2kg를 42로)이 그래프·체중 변화 안내·AI 리포트에 그대로
// 남지 않게 한다. 기록을 쓰는 화면(타임라인·홈·상세 그래프·캘린더·리포트 조건)을 모두 다시 받는다.
export function useDeleteHealthRecord() {
  const [mutate, { loading }] = useMutation(DELETE_HEALTH_RECORD_MUTATION, {
    refetchQueries: ['HealthRecords', 'HomeQuery', 'PetDetail', 'CalendarQuery', 'ReportStatus'],
  });

  async function deleteHealthRecord(id: string): Promise<boolean> {
    const result = await mutate({ variables: { id } }).catch(() => null);
    return result?.data?.deleteHealthRecord === true;
  }

  return { deleteHealthRecord, loading };
}
