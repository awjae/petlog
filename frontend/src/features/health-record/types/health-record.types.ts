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
    case 'symptom': {
      const SEVERITY: Record<number, string> = { 1: '경미함', 2: '보통', 3: '심각함' };
      const severity = numValue != null ? SEVERITY[numValue] : null;
      if (textValue && severity) return `${textValue} · ${severity}`;
      return textValue ?? '';
    }
    case 'stool': {
      const COUNT: Record<number, string> = { 1: '1회', 2: '2-3회', 3: '4회 이상' };
      const count = numValue != null ? COUNT[numValue] : null;
      if (textValue && count) return `${textValue} · ${count}`;
      return textValue ?? '';
    }
    case 'vomit': {
      const COUNT: Record<number, string> = { 1: '1회', 2: '2-3회', 3: '4회 이상' };
      const count = numValue != null ? COUNT[numValue] : null;
      if (textValue && count) return `${textValue} · ${count}`;
      if (count) return count;
      return textValue ?? '';
    }
    default:
      return textValue ?? '';
  }
}
