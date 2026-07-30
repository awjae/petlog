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
