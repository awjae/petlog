// 하루 권장 칼로리(DER) 계산.
//
// 수의 영양학에서 쓰는 표준식: 휴식기 에너지 요구량 RER = 70 × 체중(kg)^0.75 에
// 생애 단계·중성화·체중 목표별 계수를 곱한다. 계수는 WSAVA·Merck 수의 매뉴얼에 실린
// 범위의 대표값이다. 개체 차가 ±20% 이상 나므로 "시작점"이고, 체중 변화를 보며 조정한다.

export type LifeStage =
  | 'dog-puppy-young'
  | 'dog-puppy'
  | 'dog-neutered'
  | 'dog-intact'
  | 'dog-weight-loss'
  | 'cat-kitten'
  | 'cat-neutered'
  | 'cat-intact'
  | 'cat-weight-loss';

export const LIFE_STAGE_FACTOR: Record<LifeStage, number> = {
  'dog-puppy-young': 3.0, // 4개월 미만
  'dog-puppy': 2.0, // 4개월 ~ 성견
  'dog-neutered': 1.6,
  'dog-intact': 1.8,
  'dog-weight-loss': 1.0,
  'cat-kitten': 2.5,
  'cat-neutered': 1.2,
  'cat-intact': 1.4,
  'cat-weight-loss': 0.8,
};

export function restingEnergy(weightKg: number): number {
  return 70 * weightKg ** 0.75;
}

/** 하루 권장 칼로리(kcal, 정수) */
export function dailyCalories(weightKg: number, stage: LifeStage): number {
  return Math.round(restingEnergy(weightKg) * LIFE_STAGE_FACTOR[stage]);
}

/** 사료 포장지의 열량(kcal/kg)으로 하루 급여량(g, 정수)을 구한다. */
export function dailyFoodGrams(kcal: number, foodKcalPerKg: number): number {
  return Math.round((kcal / foodKcalPerKg) * 1000);
}
