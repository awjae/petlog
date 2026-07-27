// 홈 화면이 서버 응답에서 파생시키는 계산. 훅에서 분리한 이유는 순수 함수라
// 단위 테스트가 가능하기 때문이다 (homeDerive.test.ts).
//
// 기준 시각을 인자로 받는다. Date.now()를 내부에서 부르면 "오늘"이 호출 시점에
// 따라 달라져 경계 케이스를 테스트할 수 없다.

const DAY_MS = 86_400_000;

// 브라우저 로컬 타임존 기준 YYYY-MM-DD 반환
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calcDaysUntil(dueDate: string, now: Date = new Date()): number {
  const due = new Date(dueDate);
  const from = new Date(now);
  due.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - from.getTime()) / DAY_MS);
}

/**
 * 오늘(또는 어제)부터 거꾸로 이어지는 연속 기록일 수.
 *
 * 어제까지만 기록했어도 연속은 유지된다 — 오늘 아직 기록하지 않은 사용자의
 * 스트릭을 0으로 떨어뜨리면 "이미 끊겼으니 됐다"가 되어 기록 유도가 무너진다.
 */
export function calcStreak(utcIsoStrings: readonly string[], nowMs: number = Date.now()): number {
  if (utcIsoStrings.length === 0) return 0;

  const dateSet = new Set(utcIsoStrings.map((s) => toLocalDateString(new Date(s))));

  const todayStr = toLocalDateString(new Date(nowMs));
  const yesterdayStr = toLocalDateString(new Date(nowMs - DAY_MS));

  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) return 0;

  // 하루씩 뒤로 갈 때 밀리초(-86400000)가 아니라 setDate로 이동한다. 밀리초 감산은
  // DST가 있는 타임존에서 같은 로컬 날짜를 두 번 세거나 하루를 건너뛴다. 현재 사용자는
  // Asia/Seoul(DST 없음)이라 결과는 같지만, 해외 사용자가 생겨도 깨지지 않게 해 둔다.
  const cursor = new Date(dateSet.has(todayStr) ? nowMs : nowMs - DAY_MS);
  cursor.setHours(12, 0, 0, 0);

  let streak = 0;
  while (dateSet.has(toLocalDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
