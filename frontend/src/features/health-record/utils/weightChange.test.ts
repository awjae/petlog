import { describe, expect, it } from 'vitest';
import { calcWeightChange } from './weightChange';

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

  it('비교할 값이 없거나 입력이 숫자가 아니면 표시하지 않는다', () => {
    expect(calcWeightChange(null, '5')).toBeNull();
    expect(calcWeightChange(5, '')).toBeNull();
    expect(calcWeightChange(5, '0')).toBeNull();
  });
});
