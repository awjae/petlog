import { toLocalDateString } from '@/shared/utils/date';
import type { Medication } from '../types/medication.types';

// 시작일·종료일은 고른 날짜의 로컬 정오(useCreateMedication, KST 12:00)로 저장된다. 이 순간값을
// 지금과 바로 비교하면 종료일 12시부터 "종료"로 바뀌어, 그날 저녁 복용 알림과 어긋난다.
// 날짜끼리 비교해 종료일 하루 전체를 복용 중으로 본다.
export function isMedicationActive(item: Medication, now: Date = new Date()): boolean {
  const today = toLocalDateString(now);
  if (toLocalDateString(new Date(item.startDate)) > today) return false;
  if (!item.endDate) return true;
  return toLocalDateString(new Date(item.endDate)) >= today;
}
