// 하루 권장 칼로리와 사료 급여량.
//
// 수의 영양학에서 쓰는 표준 계산이다(WSAVA 영양 가이드라인, Merck Veterinary Manual).
//   휴식 에너지 요구량 RER = 70 × 체중(kg)^0.75
//   하루 에너지 요구량 MER = RER × 생애 단계 계수
// 계수는 범위로 제시되는 값이라 가장 흔히 쓰는 중간값을 고른다. 개체차가 커서 시작점일 뿐이고,
// 체중 변화를 보며 조정해야 한다고 화면에 적는다.

export type LifeStage =
  | 'dogPuppyYoung'
  | 'dogPuppy'
  | 'dogNeutered'
  | 'dogIntact'
  | 'dogWeightLoss'
  | 'catKitten'
  | 'catNeutered'
  | 'catIntact'
  | 'catWeightLoss';

export const LIFE_STAGES: { value: LifeStage; label: string; factor: number }[] = [
  { value: 'dogPuppyYoung', label: '강아지 · 4개월 미만', factor: 3.0 },
  { value: 'dogPuppy', label: '강아지 · 4~12개월', factor: 2.0 },
  { value: 'dogNeutered', label: '성견 · 중성화', factor: 1.6 },
  { value: 'dogIntact', label: '성견 · 중성화 안 함', factor: 1.8 },
  { value: 'dogWeightLoss', label: '성견 · 감량 중', factor: 1.0 },
  { value: 'catKitten', label: '새끼 고양이 · 12개월 미만', factor: 2.5 },
  { value: 'catNeutered', label: '성묘 · 중성화', factor: 1.2 },
  { value: 'catIntact', label: '성묘 · 중성화 안 함', factor: 1.4 },
  { value: 'catWeightLoss', label: '성묘 · 감량 중', factor: 0.8 },
];

export function restingEnergy(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

export interface DailyCalories {
  kcal: number;
  /** 사료 칼로리를 입력했을 때만 계산한다. */
  grams: number | null;
}

/**
 * @param weightKg 현재 체중. 감량 중이면 수의사가 정한 목표 체중을 넣는 게 일반적이다.
 * @param foodKcalPerKg 사료 포장의 대사 에너지(kcal/kg). 비어 있으면 급여량은 계산하지 않는다.
 */
export function dailyCalories(
  weightKg: number,
  stage: LifeStage,
  foodKcalPerKg: number | null,
): DailyCalories | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  const factor = LIFE_STAGES.find((s) => s.value === stage)!.factor;
  const kcal = Math.round(restingEnergy(weightKg) * factor);
  const grams =
    foodKcalPerKg != null && Number.isFinite(foodKcalPerKg) && foodKcalPerKg > 0
      ? Math.round((kcal / foodKcalPerKg) * 1000)
      : null;
  return { kcal, grams };
}
