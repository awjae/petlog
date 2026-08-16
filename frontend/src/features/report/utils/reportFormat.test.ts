import { afterEach, describe, expect, it } from 'vitest';
import { formatMonthDay } from './reportFormat';

// 러너는 TZ=Asia/Seoul로 고정돼 있어(vitest.config.ts) 그대로 두면 로컬 타임존을
// 쓰는 구현과 결과가 같아 회귀를 못 잡는다. 그래서 이 스위트만 TZ를 서울보다 뒤인
// 지역으로 바꿔, 보는 사람의 타임존과 무관하게 같은 날짜가 나오는지 확인한다.
const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe('formatMonthDay', () => {
  // 서버(report.service.ts)가 nextAvailableAt으로 주는 값의 형태 — 다음 달 1일 00:00.
  const NEXT_MONTH_START = '2026-09-01T00:00:00.000Z';

  it('보는 사람의 타임존과 무관하게 한국 기준 날짜를 낸다', () => {
    process.env.TZ = 'Asia/Seoul';
    expect(formatMonthDay(NEXT_MONTH_START)).toBe('9월 1일');

    // 로컬 타임존으로 포맷하면 8월 31일이 된다.
    process.env.TZ = 'America/New_York';
    expect(formatMonthDay(NEXT_MONTH_START)).toBe('9월 1일');
  });

  it('KST 자정 직전 인스턴트를 전날로 계산한다', () => {
    // 2026-08-31T14:59:59Z = KST 08-31 23:59:59
    expect(formatMonthDay('2026-08-31T14:59:59.000Z')).toBe('8월 31일');
    // 2026-08-31T15:00:00Z = KST 09-01 00:00:00
    expect(formatMonthDay('2026-08-31T15:00:00.000Z')).toBe('9월 1일');
  });
});
