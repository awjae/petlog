// 반려동물 나이 → 사람 나이 환산.
//
// 널리 쓰이는 방식(첫해 15살, 둘째 해 +9살 = 24살, 이후 매년 일정 나이씩)을 따른다.
// 셋째 해부터의 증가폭은 강아지 체구별로 다르다(대형견이 빨리 늙는다). 고양이는 2살 이후
// 매년 4살씩 더한다. 평균 추정치일 뿐이라 화면에도 그렇게 적는다.
//
// 체구 기준(성견 체중): 소형 10kg 미만, 중형 10~25kg, 대형 25kg 이상.

export type PetKind = 'smallDog' | 'mediumDog' | 'largeDog' | 'cat';

const YEARLY_AFTER_TWO: Record<PetKind, number> = {
  smallDog: 4,
  mediumDog: 5,
  largeDog: 7,
  cat: 4,
};

export const PET_KIND_LABEL: Record<PetKind, string> = {
  smallDog: '소형견 (10kg 미만)',
  mediumDog: '중형견 (10~25kg)',
  largeDog: '대형견 (25kg 이상)',
  cat: '고양이',
};

/** @param petYears 반려동물 나이(년). 개월은 소수로 넘긴다(예: 1년 6개월 = 1.5). */
export function toHumanAge(kind: PetKind, petYears: number): number {
  if (!Number.isFinite(petYears) || petYears <= 0) return 0;

  let human: number;
  if (petYears <= 1) human = 15 * petYears;
  else if (petYears <= 2) human = 15 + 9 * (petYears - 1);
  else human = 24 + YEARLY_AFTER_TWO[kind] * (petYears - 2);

  return Math.round(human);
}
