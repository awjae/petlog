// `<input type="date">`와 API가 쓰는 `YYYY-MM-DD` 문자열을 만든다.
//
// `toISOString().split('T')[0]`을 쓰면 안 된다 — UTC 기준이라 KST(UTC+9)에서는
// 00시~09시 사이에 어제 날짜가 나온다. 새벽에 기록하는 보호자에게 기본 날짜가
// 하루 전으로 잡히고, `max` 속성에 쓰면 오늘을 아예 선택할 수 없다.
//
// 기준 시간대는 기기의 로컬 시간대다. "지금 나에게 몇 일인가"가 사용자가 기대하는
// 값이므로 Asia/Seoul로 고정하지 않는다.

/** 브라우저 로컬 타임존 기준 YYYY-MM-DD 반환 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘 날짜 (로컬 기준 YYYY-MM-DD) */
export function localToday(): string {
  return toLocalDateString(new Date());
}

/**
 * 기간의 시작 경계. 오늘을 포함해 days일이므로 days - 1을 뺀다.
 * 기록 시각이 로컬 날짜의 정오로 저장되므로 경계도 로컬 0시로 잡는다
 * (내보내기 기간과 수치 그래프의 최근 90일이 이 경계를 쓴다).
 */
export function periodStart(days: number, now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

/**
 * `YYYY-MM-DD`에 일·년을 더한 `YYYY-MM-DD`. 정오로 계산해 서머타임 경계에서도 날짜가 밀리지 않는다.
 * 2월 29일에 1년을 더하면 3월 1일이 아니라 2월 28일로 맞춘다 — "1년 뒤 같은 달"이 기대값이다.
 */
export function addToDate(ymd: string, { days = 0, years = 0 }: { days?: number; years?: number }) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y + years, m - 1, d, 12);
  if (years !== 0 && date.getMonth() !== m - 1) date.setDate(0);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}
