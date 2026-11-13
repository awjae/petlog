import { describe, expect, it } from 'vitest';
import { dailyCalories, restingEnergy } from './dailyCalories';

describe('dailyCalories', () => {
  // 10kg → 10^0.75 = 5.623 → RER 393.6
  it('RER = 70 × 체중^0.75', () => {
    expect(Math.round(restingEnergy(10))).toBe(394);
  });

  it('생애 단계 계수를 곱한다', () => {
    expect(dailyCalories(10, 'dogNeutered', null)).toEqual({ kcal: 630, grams: null }); // 393.6 × 1.6
    expect(dailyCalories(4, 'catNeutered', null)?.kcal).toBe(238); // 70 × 2.828 × 1.2
  });

  it('사료 칼로리(kcal/kg)를 넣으면 하루 급여량(g)을 계산한다', () => {
    // 630kcal ÷ 3,500kcal/kg = 0.18kg
    expect(dailyCalories(10, 'dogNeutered', 3500)?.grams).toBe(180);
  });

  it('체중이 없거나 0 이하면 계산하지 않는다', () => {
    expect(dailyCalories(0, 'dogNeutered', null)).toBeNull();
    expect(dailyCalories(Number.NaN, 'catIntact', 3500)).toBeNull();
  });
});
