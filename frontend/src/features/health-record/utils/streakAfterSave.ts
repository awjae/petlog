import { calcStreak } from '@/features/home/utils/homeDerive';

// 기록을 저장한 순간 보여줄 연속 기록 축하.
//
// 홈에는 "N일 연속 기록 중"이 있지만, 기록을 저장한 순간에는 보상이 보이지 않았다. 습관 앱
// (Duolingo 등)이 연속 기록을 저장 직후에 보여주는 것은 그때가 다음 기록을 약속하게 만드는
// 순간이기 때문이다. 모든 저장마다 크게 축하하면 의미가 없어서 정해진 날에만 크게 보여준다.
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100] as const;

export interface StreakAfterSave {
  days: number;
  milestone: boolean;
}

/**
 * @param recordDates 저장 전 기록일 목록(홈 쿼리의 recordDates)
 * @param savedDate 이번에 저장한 기록의 날짜(YYYY-MM-DD, 로컬). 과거 날짜로 소급 입력할 수 있다.
 * @returns 이번 저장으로 연속 기록이 늘었을 때만 값이 있다. 같은 날 두 번째 기록이나 과거
 *          날짜 입력처럼 연속이 그대로면 null — 이미 본 축하를 반복하지 않는다.
 */
export function streakAfterSave(
  recordDates: readonly string[],
  savedDate: string,
  nowMs: number = Date.now(),
): StreakAfterSave | null {
  const before = calcStreak(recordDates, nowMs);
  // 기록 시각은 로컬 날짜의 정오로 저장된다(useCreateHealthRecord).
  const after = calcStreak(
    [...recordDates, new Date(`${savedDate}T12:00:00`).toISOString()],
    nowMs,
  );
  if (after <= before || after < 2) return null;
  return { days: after, milestone: (STREAK_MILESTONES as readonly number[]).includes(after) };
}
