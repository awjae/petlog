import { describe, expect, it } from 'vitest';
import { streakAfterSave } from './streakAfterSave';

// TZ=Asia/Seoul 고정 (vitest.config.ts). 기록일은 로컬 정오 앵커.
const day = (ymd: string) => new Date(`${ymd}T12:00:00`).toISOString();
const NOW = new Date('2026-11-13T20:00:00').getTime();

describe('streakAfterSave', () => {
  it('어제까지 2일 연속이면 오늘 저장으로 3일, 마일스톤이다', () => {
    expect(streakAfterSave([day('2026-11-11'), day('2026-11-12')], '2026-11-13', NOW)).toEqual({
      days: 3,
      milestone: true,
    });
  });

  it('마일스톤이 아닌 날은 일수만 알린다', () => {
    const dates = ['2026-11-10', '2026-11-11', '2026-11-12'].map(day);
    expect(streakAfterSave(dates, '2026-11-13', NOW)).toEqual({ days: 4, milestone: false });
  });

  it('오늘 이미 기록했으면(두 번째 기록) 축하하지 않는다', () => {
    expect(streakAfterSave([day('2026-11-12'), day('2026-11-13')], '2026-11-13', NOW)).toBeNull();
  });

  it('첫 기록(1일)은 연속이라고 부르지 않는다', () => {
    expect(streakAfterSave([], '2026-11-13', NOW)).toBeNull();
  });

  // 끊긴 사이를 과거 날짜로 메우면 연속이 실제로 이어지므로 알린다.
  it('빠진 어제를 소급 입력해 연속이 이어지면 알린다', () => {
    expect(streakAfterSave([day('2026-11-11'), day('2026-11-13')], '2026-11-12', NOW)).toEqual({
      days: 3,
      milestone: true,
    });
  });
});
