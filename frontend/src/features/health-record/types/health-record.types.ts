import type { HealthRecordsQuery, HealthRecordType } from '@/generated/graphql';

export type HealthRecord = HealthRecordsQuery['healthRecords'][number];

export const TYPE_LABEL: Record<HealthRecordType, string> = {
  weight: '체중',
  appetite: '식사',
  activity: '산책',
  mood: '메모',
  symptom: '증상',
  stool: '배변',
  vomit: '구토',
};

export function buildSummary(
  type: HealthRecordType,
  numValue: number | null,
  textValue: string | null,
): string {
  switch (type) {
    case 'weight':
      return numValue != null ? `${numValue} kg` : '';
    case 'appetite':
      return textValue ?? '';
    case 'activity': {
      const duration = numValue != null ? `${numValue}분` : '';
      const distance = textValue ? ` · ${textValue}km` : '';
      return duration + distance;
    }
    case 'mood':
      return textValue ?? '';
    default:
      return textValue ?? '';
  }
}
