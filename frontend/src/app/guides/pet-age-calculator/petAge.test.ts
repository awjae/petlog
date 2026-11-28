import { describe, it, expect } from 'vitest';
import { toHumanAge } from './petAge';

describe('toHumanAge', () => {
  it('첫 해는 체급과 상관없이 15세, 둘째 해는 24세다', () => {
    for (const kind of ['dog-small', 'dog-large', 'cat'] as const) {
      expect(toHumanAge(kind, 12)).toBe(15);
      expect(toHumanAge(kind, 24)).toBe(24);
    }
  });

  it('첫 해 안에서는 개월 수만큼 비례한다', () => {
    expect(toHumanAge('cat', 6)).toBe(8);
    expect(toHumanAge('dog-small', 0)).toBe(0);
  });

  it('세 번째 해부터는 대형견이 소형견보다 빨리 늙는다', () => {
    expect(toHumanAge('dog-small', 10 * 12)).toBe(56);
    expect(toHumanAge('dog-medium', 10 * 12)).toBe(60);
    expect(toHumanAge('dog-large', 10 * 12)).toBe(68);
    expect(toHumanAge('cat', 15 * 12)).toBe(76);
  });
});
