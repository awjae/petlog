// 체중 입력 화면에서 직전 체중 대비 변화를 보여준다.
//
// 기준 5%는 가이드 글(/guides/dog-weight-check)의 "의도하지 않은 체중의 5% 이상 변화"와
// 같은 숫자다. 글과 앱이 다른 숫자를 말하면 둘 다 신뢰를 잃는다.
//
// 성장기는 경고하지 않는다. 가이드도 "의도하지 않은" 변화를 말하고 성장기는 따로 본다.
// 성장기 강아지는 일주일에 5% 넘게 느는 게 정상이라, 빼지 않으면 기록할 때마다 상담을
// 권하게 되고 그러면 경고 자체를 무시하게 된다. 변화량 표시는 성장기에도 유지한다.
export const NOTABLE_WEIGHT_CHANGE_RATIO = 0.05;

export interface WeightChange {
  previous: number;
  diff: number;
  // 퍼센트, 소수 첫째 자리 반올림
  percent: number;
  notable: boolean;
}

// ponytail: 성장기를 1살 미만으로 일괄 본다. 대형견은 18~24개월까지 크므로 그 사이엔 경고가
// 뜰 수 있다 — 품종 크기별 성장 기간이 필요해지면 BreedProfile 쪽 정보로 바꾼다.
// 생일을 모르면 성장기로 보지 않는다(경고를 숨기는 쪽보다 보이는 쪽이 안전하다).
export function isGrowing(birthDate: string | null, now: Date = new Date()): boolean {
  if (!birthDate) return false;
  const firstBirthday = new Date(birthDate);
  firstBirthday.setFullYear(firstBirthday.getFullYear() + 1);
  return now < firstBirthday;
}

export function calcWeightChange(
  previous: number | null,
  input: string,
  growing = false,
): WeightChange | null {
  const current = parseFloat(input);
  if (previous == null || previous <= 0 || Number.isNaN(current) || current <= 0) return null;

  const diff = Math.round((current - previous) * 100) / 100;
  const ratio = (current - previous) / previous;
  return {
    previous,
    diff,
    percent: Math.round(ratio * 1000) / 10,
    notable: !growing && Math.abs(ratio) >= NOTABLE_WEIGHT_CHANGE_RATIO,
  };
}
