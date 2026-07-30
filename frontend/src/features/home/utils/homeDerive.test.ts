import { describe, expect, it } from 'vitest';
import { calcDaysUntil, calcStreak } from './homeDerive';

// 모든 테스트는 TZ=Asia/Seoul 고정으로 실행된다 (package.json의 test:unit).
// 이 로직은 "UTC ISO 문자열을 로컬 날짜로 접는" 변환이 핵심이라, 타임존이 흔들리면
// 검증 자체가 무의미해진다.

const SEOUL_NOON_2026_07_26 = new Date('2026-07-26T12:00:00+09:00').getTime();

/** 서울 기준 해당 날짜 오전 9시를 UTC ISO로 (서버가 주는 형태와 동일) */
function seoulDate(day: string): string {
  return new Date(`${day}T09:00:00+09:00`).toISOString();
}

describe('calcStreak', () => {
  it('기록이 없으면 0', () => {
    expect(calcStreak([], SEOUL_NOON_2026_07_26)).toBe(0);
  });

  it('오늘부터 이어지는 날짜를 센다', () => {
    const dates = [seoulDate('2026-07-26'), seoulDate('2026-07-25'), seoulDate('2026-07-24')];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(3);
  });

  it('오늘 기록이 없어도 어제까지 이어졌으면 유지한다', () => {
    // 오늘 아직 기록하지 않은 사용자의 스트릭을 0으로 떨어뜨리면 기록 유도가 무너진다.
    const dates = [seoulDate('2026-07-25'), seoulDate('2026-07-24')];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(2);
  });

  it('그제까지만 기록했으면 끊긴 것으로 본다', () => {
    const dates = [seoulDate('2026-07-24'), seoulDate('2026-07-23')];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(0);
  });

  it('중간에 빠진 날이 있으면 거기서 멈춘다', () => {
    const dates = [
      seoulDate('2026-07-26'),
      seoulDate('2026-07-25'),
      // 24일 없음
      seoulDate('2026-07-23'),
      seoulDate('2026-07-22'),
    ];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(2);
  });

  it('같은 날 여러 번 기록해도 하루로 센다', () => {
    const dates = [
      new Date('2026-07-26T01:00:00+09:00').toISOString(),
      new Date('2026-07-26T22:00:00+09:00').toISOString(),
      seoulDate('2026-07-25'),
    ];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(2);
  });

  it('월 경계를 넘어서도 이어진다', () => {
    const now = new Date('2026-08-01T12:00:00+09:00').getTime();
    const dates = [seoulDate('2026-08-01'), seoulDate('2026-07-31'), seoulDate('2026-07-30')];
    expect(calcStreak(dates, now)).toBe(3);
  });

  it('UTC로는 전날인 서울 새벽 기록을 오늘로 센다', () => {
    // 서울 2026-07-26 00:30 = UTC 2026-07-25T15:30Z.
    // UTC 기준으로 자르면 "어제"가 되어 스트릭이 어긋난다.
    const dates = ['2026-07-25T15:30:00Z'];
    expect(calcStreak(dates, SEOUL_NOON_2026_07_26)).toBe(1);
  });
});

describe('calcDaysUntil', () => {
  const now = new Date('2026-07-26T23:30:00+09:00');

  it('같은 날이면 0', () => {
    expect(calcDaysUntil('2026-07-26T00:00:00+09:00', now)).toBe(0);
  });

  it('시각과 무관하게 날짜 차이로 계산한다', () => {
    // 23:30에서 내일 00:10까지는 40분 뒤지만 "1일 남음"이어야 한다.
    expect(calcDaysUntil('2026-07-27T00:10:00+09:00', now)).toBe(1);
  });

  it('지난 일정은 음수', () => {
    expect(calcDaysUntil('2026-07-24T09:00:00+09:00', now)).toBe(-2);
  });
});
