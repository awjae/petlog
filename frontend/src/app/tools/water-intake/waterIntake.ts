// 하루 음수량 기준과 측정값 판정.
//
// 숫자는 음수량 가이드(/guides/pet-water-intake)와 같다. 글과 도구가 다른 숫자를 말하면
// 둘 다 신뢰를 잃는다. 가이드를 고치면 여기도 같이 고친다.
//   - 평소 범위(체중 1kg당 하루): 개 50~60mL, 고양이 40~50mL
//   - 많이 마시는 기준(다음): 개 100mL, 고양이 50mL를 넘는 날이 이어질 때
//
// "적게 마신다" 판정은 하지 않는다. 습식 사료·간식의 수분이 빠져 있어 측정값이 낮게 나오는
// 게 흔하고, 그걸 이상으로 표시하면 오경고가 된다.

export type WaterSpecies = 'dog' | 'cat';

export const WATER_ML_PER_KG: Record<
  WaterSpecies,
  { typicalMin: number; typicalMax: number; high: number }
> = {
  dog: { typicalMin: 50, typicalMax: 60, high: 100 },
  cat: { typicalMin: 40, typicalMax: 50, high: 50 },
};

export interface WaterIntakeResult {
  typical: { min: number; max: number };
  high: number;
  highPerKg: number;
  /** 측정값을 넣었을 때만 있다. */
  measuredPerKg: number | null;
  isHigh: boolean;
}

export function waterIntake(
  species: WaterSpecies,
  weightKg: number,
  measuredMl: number | null,
): WaterIntakeResult | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  const ref = WATER_ML_PER_KG[species];

  const measuredPerKg =
    measuredMl != null && Number.isFinite(measuredMl) && measuredMl > 0
      ? Math.round(measuredMl / weightKg)
      : null;

  return {
    typical: {
      min: Math.round(ref.typicalMin * weightKg),
      max: Math.round(ref.typicalMax * weightKg),
    },
    high: Math.round(ref.high * weightKg),
    highPerKg: ref.high,
    measuredPerKg,
    isHigh: measuredPerKg != null && measuredPerKg > ref.high,
  };
}
