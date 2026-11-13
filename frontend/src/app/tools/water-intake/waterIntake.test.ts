import { describe, expect, it } from 'vitest';
import { waterIntake } from './waterIntake';

// 기준값은 음수량 가이드(/guides/pet-water-intake)의 숫자와 같아야 한다.
describe('waterIntake', () => {
  it('개: 평소 50~60mL/kg, 많음 기준 100mL/kg', () => {
    expect(waterIntake('dog', 5, null)).toEqual({
      typical: { min: 250, max: 300 },
      high: 500,
      highPerKg: 100,
      measuredPerKg: null,
      isHigh: false,
    });
  });

  it('고양이: 평소 40~50mL/kg, 많음 기준 50mL/kg', () => {
    const r = waterIntake('cat', 4, null);
    expect(r?.typical).toEqual({ min: 160, max: 200 });
    expect(r?.high).toBe(200);
  });

  it('측정값이 종별 기준을 넘을 때만 많이 마신다고 판정한다', () => {
    expect(waterIntake('dog', 5, 500)?.isHigh).toBe(false); // 정확히 100
    expect(waterIntake('dog', 5, 510)?.isHigh).toBe(true);
    // 같은 1kg당 75mL라도 개는 기준 아래, 고양이는 기준 위다.
    expect(waterIntake('dog', 4, 300)?.isHigh).toBe(false);
    expect(waterIntake('cat', 4, 300)?.isHigh).toBe(true);
    // 적게 마신 날은 판정하지 않는다 — 습식 사료 수분이 빠져 낮게 나오는 게 흔하다.
    expect(waterIntake('cat', 4, 40)?.isHigh).toBe(false);
  });

  it('체중이 없으면 계산하지 않는다', () => {
    expect(waterIntake('dog', 0, 300)).toBeNull();
  });
});
