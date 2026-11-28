import { describe, it, expect } from 'vitest';
import { dailyCalories, dailyFoodGrams, restingEnergy } from './petCalorie';

describe('petCalorie', () => {
  it('RER은 70 × 체중^0.75 다', () => {
    // 1kg이면 정확히 70kcal, 16kg이면 70 × 8 = 560kcal
    expect(restingEnergy(1)).toBe(70);
    expect(restingEnergy(16)).toBeCloseTo(560);
  });

  it('생애 단계 계수를 곱한다', () => {
    expect(dailyCalories(16, 'dog-neutered')).toBe(896); // 560 × 1.6
    expect(dailyCalories(16, 'dog-weight-loss')).toBe(560);
    expect(dailyCalories(1, 'cat-neutered')).toBe(84); // 70 × 1.2
  });

  it('사료 열량(kcal/kg)으로 급여량(g)을 구한다', () => {
    expect(dailyFoodGrams(896, 3500)).toBe(256);
  });
});
