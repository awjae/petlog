// 체중 입력 화면에서 직전 체중 대비 변화를 보여준다.
//
// 기준 5%는 가이드 글(/guides/dog-weight-check)의 "의도하지 않은 체중의 5% 이상 변화"와
// 같은 숫자다. 글과 앱이 다른 숫자를 말하면 둘 다 신뢰를 잃는다.
export const NOTABLE_WEIGHT_CHANGE_RATIO = 0.05;

export interface WeightChange {
  previous: number;
  diff: number;
  // 퍼센트, 소수 첫째 자리 반올림
  percent: number;
  notable: boolean;
}

export function calcWeightChange(previous: number | null, input: string): WeightChange | null {
  const current = parseFloat(input);
  if (previous == null || previous <= 0 || Number.isNaN(current) || current <= 0) return null;

  const diff = Math.round((current - previous) * 100) / 100;
  const ratio = (current - previous) / previous;
  return {
    previous,
    diff,
    percent: Math.round(ratio * 1000) / 10,
    notable: Math.abs(ratio) >= NOTABLE_WEIGHT_CHANGE_RATIO,
  };
}
