import { describe, expect, it } from 'vitest';
import { toHumanAge } from './petAge';

describe('toHumanAge', () => {
  it('첫해는 15살, 둘째 해까지 24살이다 (체구 무관)', () => {
    expect(toHumanAge('smallDog', 1)).toBe(15);
    expect(toHumanAge('largeDog', 1)).toBe(15);
    expect(toHumanAge('cat', 2)).toBe(24);
    expect(toHumanAge('mediumDog', 0.5)).toBe(8); // 7.5 → 반올림
  });

  it('셋째 해부터는 체구별로 다르게 늘어난다', () => {
    expect(toHumanAge('smallDog', 10)).toBe(56); // 24 + 4×8
    expect(toHumanAge('mediumDog', 10)).toBe(64); // 24 + 5×8
    expect(toHumanAge('largeDog', 10)).toBe(80); // 24 + 7×8
    expect(toHumanAge('cat', 10)).toBe(56);
  });

  it('0 이하나 숫자가 아닌 입력은 0으로 둔다', () => {
    expect(toHumanAge('cat', 0)).toBe(0);
    expect(toHumanAge('cat', Number.NaN)).toBe(0);
  });
});
