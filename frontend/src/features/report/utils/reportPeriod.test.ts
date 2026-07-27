import { describe, expect, it } from 'vitest';
import {
  addDays,
  clampDate,
  diffDaysInclusive,
  getPresetRange,
  isPresetAvailable,
  toEndOfDayIso,
  toStartOfDayIso,
} from './reportPeriod';

// TZ=Asia/Seoul 고정 (package.json의 test:unit).

describe('addDays', () => {
  it('월 경계를 넘는다', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('연 경계를 넘는다', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('윤년 2월을 처리한다', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('diffDaysInclusive', () => {
  it('양끝을 포함해 센다', () => {
    expect(diffDaysInclusive('2026-06-01', '2026-06-07')).toBe(7);
  });

  it('같은 날은 1일', () => {
    expect(diffDaysInclusive('2026-06-01', '2026-06-01')).toBe(1);
  });

  it('연 경계를 넘어도 맞는다', () => {
    expect(diffDaysInclusive('2025-12-30', '2026-01-02')).toBe(4);
  });
});

describe('getPresetRange', () => {
  it('last7은 오늘을 포함한 7일', () => {
    const { start, end } = getPresetRange('last7', '2026-07-26');
    expect(start).toBe('2026-07-20');
    expect(end).toBe('2026-07-26');
    expect(diffDaysInclusive(start, end)).toBe(7);
  });

  it('last30 / last90도 오늘 포함 일수가 정확하다', () => {
    const r30 = getPresetRange('last30', '2026-07-26');
    expect(diffDaysInclusive(r30.start, r30.end)).toBe(30);

    const r90 = getPresetRange('last90', '2026-07-26');
    expect(diffDaysInclusive(r90.start, r90.end)).toBe(90);
  });

  it('lastMonth는 지난달 1일~말일', () => {
    const { start, end } = getPresetRange('lastMonth', '2026-07-26');
    expect(start).toBe('2026-06-01');
    expect(end).toBe('2026-06-30');
  });

  it('1월의 lastMonth는 전년 12월', () => {
    const { start, end } = getPresetRange('lastMonth', '2026-01-15');
    expect(start).toBe('2025-12-01');
    expect(end).toBe('2025-12-31');
  });

  it('3월의 lastMonth는 윤년 2월 29일까지', () => {
    const { start, end } = getPresetRange('lastMonth', '2028-03-10');
    expect(start).toBe('2028-02-01');
    expect(end).toBe('2028-02-29');
  });
});

describe('isPresetAvailable', () => {
  const today = '2026-07-26';

  it('등록일이 프리셋 시작보다 이르면 선택 가능', () => {
    expect(isPresetAvailable('last7', '2026-01-01', today)).toBe(true);
  });

  it('등록일이 프리셋 시작보다 늦으면 불가', () => {
    // 90일 전은 2026-04-28인데 5월에 등록했으므로 데이터가 없다.
    expect(isPresetAvailable('last90', '2026-05-01', today)).toBe(false);
  });

  it('등록일과 프리셋 시작이 같은 날이면 가능', () => {
    expect(isPresetAvailable('last7', '2026-07-20', today)).toBe(true);
  });
});

describe('clampDate', () => {
  it('범위를 벗어나면 경계로 당긴다', () => {
    expect(clampDate('2026-01-01', '2026-06-01', '2026-07-26')).toBe('2026-06-01');
    expect(clampDate('2026-12-31', '2026-06-01', '2026-07-26')).toBe('2026-07-26');
  });

  it('범위 안이면 그대로', () => {
    expect(clampDate('2026-07-01', '2026-06-01', '2026-07-26')).toBe('2026-07-01');
  });
});

describe('서버 전송용 ISO 변환', () => {
  it('하루 시작은 서울 00:00 = 전날 15:00Z', () => {
    expect(toStartOfDayIso('2026-07-26')).toBe('2026-07-25T15:00:00.000Z');
  });

  it('하루 끝은 서울 23:59:59 = 당일 14:59:59Z', () => {
    expect(toEndOfDayIso('2026-07-26')).toBe('2026-07-26T14:59:59.000Z');
  });

  it('시작과 끝이 같은 로컬 날짜를 감싼다', () => {
    const start = new Date(toStartOfDayIso('2026-07-26'));
    const end = new Date(toEndOfDayIso('2026-07-26'));
    expect(end.getTime() - start.getTime()).toBeLessThan(86_400_000);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});
