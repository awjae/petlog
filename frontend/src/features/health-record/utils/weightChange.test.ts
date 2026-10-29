import { describe, expect, it } from 'vitest';
import { calcWeightChange, isGrowing } from './weightChange';

describe('calcWeightChange', () => {
  it('직전 체중 대비 변화량과 비율을 계산한다', () => {
    expect(calcWeightChange(5, '5.2')).toEqual({
      previous: 5,
      diff: 0.2,
      percent: 4,
      notable: false,
    });
  });

  // 가이드: 5kg인 아이라면 250g이 5%다.
  it('5% 이상 변화부터 눈여겨볼 변화로 표시한다 (증가·감소 모두)', () => {
    expect(calcWeightChange(5, '5.25')?.notable).toBe(true);
    expect(calcWeightChange(5, '4.75')?.notable).toBe(true);
    expect(calcWeightChange(5, '4.8')?.notable).toBe(false);
  });

  it('성장기에는 변화량은 보여주되 경고하지 않는다', () => {
    const change = calcWeightChange(2, '2.3', true);
    expect(change?.percent).toBe(15);
    expect(change?.notable).toBe(false);
  });

  it('비교할 값이 없거나 입력이 숫자가 아니면 표시하지 않는다', () => {
    expect(calcWeightChange(null, '5')).toBeNull();
    expect(calcWeightChange(5, '')).toBeNull();
    expect(calcWeightChange(5, '0')).toBeNull();
  });
});

describe('isGrowing', () => {
  const now = new Date('2026-10-30T12:00:00');

  it('첫 생일 전이면 성장기다', () => {
    expect(isGrowing('2026-01-15', now)).toBe(true);
    expect(isGrowing('2025-11-01', now)).toBe(true);
  });

  it('첫 생일이 지났으면 성장기가 아니다', () => {
    expect(isGrowing('2025-10-29', now)).toBe(false);
    expect(isGrowing('2020-05-01', now)).toBe(false);
  });

  // 생일을 모르는데 성장기로 보면 성견의 급격한 변화 경고가 사라진다.
  it('생일을 모르면 성장기로 보지 않는다', () => {
    expect(isGrowing(null, now)).toBe(false);
  });
});
