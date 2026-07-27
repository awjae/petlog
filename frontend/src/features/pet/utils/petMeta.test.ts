import { describe, expect, it } from 'vitest';
import { calcAge, formatPetMeta, formatRelativeDate } from './petMeta';

// TZ=Asia/Seoul 고정 (vitest.config.ts의 test.env).
//
// 알려진 한계: calcAge는 birthDate를 로컬 타임존으로 해석한다. 서버가 birthDate를
// DateTime(UTC 자정)으로 주므로, UTC 서쪽 타임존(예: America/Los_Angeles)에서는
// 로컬 날짜가 하루 밀려 생일 하루 전에 나이를 먹는다. 근본 해결은 날짜 전용 표현으로
// 바꾸는 스키마 결정이라 여기서 다루지 않는다. 현재 사용자는 모두 한국이다.

const NOW = new Date('2026-07-26T12:00:00+09:00');

describe('calcAge', () => {
  it('12개월 미만은 개월로 표시한다', () => {
    expect(calcAge('2026-01-26', NOW)).toBe('6개월');
  });

  it('생일 당일에 1살이 된다', () => {
    expect(calcAge('2025-07-26', NOW)).toBe('1살');
  });

  it('생일 전날까지는 아직 11개월이다', () => {
    // 2025-07-30생은 2026-07-26 시점에 아직 만 1년이 되지 않았다.
    // 연/월 차이만 계산하면 "1살"이 되어 4일 먼저 나이를 먹는다.
    expect(calcAge('2025-07-30', NOW)).toBe('11개월');
  });

  it('월 경계에서도 일자를 반영한다', () => {
    // 2026-06-27생은 아직 한 달이 지나지 않았다.
    expect(calcAge('2026-06-27', NOW)).toBe('0개월');
    expect(calcAge('2026-06-26', NOW)).toBe('1개월');
  });

  it('여러 해가 지나면 연 단위로 내림한다', () => {
    expect(calcAge('2023-03-01', NOW)).toBe('3살');
  });

  it('미래 날짜가 들어와도 음수를 내보내지 않는다', () => {
    expect(calcAge('2027-01-01', NOW)).toBe('0개월');
  });
});

describe('formatPetMeta', () => {
  it('종·품종·나이를 가운뎃점으로 잇는다', () => {
    const meta = formatPetMeta({ species: 'dog', breed: '푸들', birthDate: '2025-07-26' }, NOW);
    expect(meta).toBe('강아지 · 푸들 · 1살');
  });

  it('품종이 없으면 그 자리를 비우지 않고 건너뛴다', () => {
    expect(formatPetMeta({ species: 'cat', breed: null, birthDate: '2025-07-26' }, NOW)).toBe(
      '고양이 · 1살',
    );
  });

  it('생년월일이 없으면 종만 남는다', () => {
    expect(formatPetMeta({ species: 'cat', breed: null, birthDate: null }, NOW)).toBe('고양이');
  });
});

describe('formatRelativeDate', () => {
  it('오늘은 "오늘"', () => {
    expect(formatRelativeDate('2026-07-26T01:00:00+09:00', NOW)).toBe('오늘');
  });

  it('7일 이내는 "N일 전"', () => {
    expect(formatRelativeDate('2026-07-19T23:00:00+09:00', NOW)).toBe('7일 전');
  });

  it('7일을 넘으면 월.일', () => {
    expect(formatRelativeDate('2026-07-18T09:00:00+09:00', NOW)).toBe('7.18');
  });

  it('미래 날짜는 월.일로 떨어진다', () => {
    expect(formatRelativeDate('2026-08-01T09:00:00+09:00', NOW)).toBe('8.1');
  });
});
