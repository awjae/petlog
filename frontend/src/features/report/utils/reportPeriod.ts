// 리포트 기간 선택 바텀시트에서 쓰는 날짜 계산 유틸.
// 내부적으로 기간은 항상 'YYYY-MM-DD' 형태의 캘린더 날짜 문자열로 다룬다.
// 서버(DateTime 스칼라) 전송 직전에만 ISO datetime 문자열로 변환한다.

export const MIN_PERIOD_DAYS = 7;
export const MAX_PERIOD_DAYS = 90;
export const MIN_RECORD_COUNT = 10;
export const MIN_RECORD_DAYS = 7;

export type PeriodPresetKey = 'last7' | 'last30' | 'last90' | 'lastMonth';

export interface PeriodPreset {
  key: PeriodPresetKey;
  label: string;
}

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  { key: 'last7', label: '최근 7일' },
  { key: 'last30', label: '최근 30일' },
  { key: 'last90', label: '최근 90일' },
  { key: 'lastMonth', label: '지난달' },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateOnly(): string {
  return toDateOnly(new Date());
}

export function toDateOnlyFromIso(iso: string): string {
  return toDateOnly(new Date(iso));
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

// 두 날짜(포함) 사이의 총 일수. 예: 6/1 ~ 6/7 => 7
export function diffDaysInclusive(start: string, end: string): number {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return diff + 1;
}

// 캘린더 날짜 문자열을 서버로 보낼 하루 시작 시각 ISO datetime으로 변환한다.
export function toStartOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

// 캘린더 날짜 문자열을 서버로 보낼 하루 끝 시각 ISO datetime으로 변환한다.
export function toEndOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59`).toISOString();
}

export function clampDate(dateStr: string, minDate: string, maxDate: string): string {
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
}

export function minDateStr(a: string, b: string): string {
  return a < b ? a : b;
}

export function maxDateStr(a: string, b: string): string {
  return a > b ? a : b;
}

export function getPresetRange(
  key: PeriodPresetKey,
  today: string,
): { start: string; end: string } {
  switch (key) {
    case 'last7':
      return { start: addDays(today, -6), end: today };
    case 'last30':
      return { start: addDays(today, -29), end: today };
    case 'last90':
      return { start: addDays(today, -89), end: today };
    case 'lastMonth': {
      const [y, m] = today.split('-').map(Number);
      const lastDayOfPrevMonth = new Date(y, m - 1, 0);
      const firstDayOfPrevMonth = new Date(y, m - 2, 1);
      return { start: toDateOnly(firstDayOfPrevMonth), end: toDateOnly(lastDayOfPrevMonth) };
    }
  }
}

// 반려동물 등록일(minDate) 기준으로 프리셋 전체 구간이 선택 가능한지 여부.
export function isPresetAvailable(key: PeriodPresetKey, minDate: string, today: string): boolean {
  const { start } = getPresetRange(key, today);
  return start >= minDate;
}

export function formatPeriodSummary(start: string, end: string): string {
  const [, sm, sd] = start.split('-').map(Number);
  const [, em, ed] = end.split('-').map(Number);
  const days = diffDaysInclusive(start, end);
  return `${sm}월 ${sd}일 ~ ${em}월 ${ed}일 (총 ${days}일)`;
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
