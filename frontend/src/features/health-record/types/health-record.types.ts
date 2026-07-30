import type { HealthRecordsQuery, HealthRecordType } from '@/generated/graphql';

export type HealthRecord = HealthRecordsQuery['healthRecords'][number];

/**
 * 식사 기록의 화면 선택지.
 *
 * 서버는 이 값을 모른다 — GraphQL 스키마에 대응하는 enum이 없고, 저장될 때는
 * APPETITE_LABEL(useCreateHealthRecord)을 거쳐 한국어 문자열이 textValue로 나간다.
 * 즉 wire 타입이 아니라 UI 타입이라 api가 아니라 여기에 둔다.
 *
 * 이름을 Level이 아니라 Choice로 둔 이유: libs/types와 libs/ai에 값이 다른
 * AppetiteLevel이 이미 있어서(none|low|normal|high, good|normal|poor) 같은 이름을
 * 쓰면 어느 쪽인지 구분되지 않는다.
 */
export type AppetiteChoice = 'good' | 'normal' | 'bad';

export const TYPE_LABEL: Record<HealthRecordType, string> = {
  weight: '체중',
  appetite: '식사',
  activity: '산책',
  mood: '메모',
  symptom: '증상',
  stool: '배변',
  vomit: '구토',
};

/**
 * 외부에서 들어온 문자열(URL 쿼리 등)이 기록 유형인지 판정한다.
 *
 * 유형 목록을 따로 배열로 두면 유형이 추가돼도 컴파일러가 안 잡는다.
 * `TYPE_LABEL`은 `Record<HealthRecordType, string>`이라 누락되면 컴파일이 깨지므로
 * 여기서 파생시킨다.
 */
export function isHealthRecordType(value: string | null): value is HealthRecordType {
  return value !== null && value in TYPE_LABEL;
}

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
