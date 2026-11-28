// 반려동물 나이 → 사람 나이 환산.
//
// AVMA(미국수의사회)의 개 나이 환산표와 같은 흐름의 단순 환산을 따른다.
// 첫 해 15세, 둘째 해까지 24세, 그 뒤로는 해마다 일정하게 더한다. 개는 몸집이 클수록
// 빨리 늙어서 세 번째 해부터 더하는 값이 체급마다 다르다(AVMA 표의 10살 값 — 소형 56,
// 중형 60, 대형 66, 초대형 78 — 에 맞춘 기울기. 대형은 대형·초대형 사이로 잡았다).
// 고양이는 소형견과 같은 흐름이다.
// 정밀한 생물학적 나이가 아니라 "대략 이 정도"를 말하는 참고치다 — 화면에도 그렇게 적는다.

export type PetKind = 'dog-small' | 'dog-medium' | 'dog-large' | 'cat';

// 세 번째 해부터 1년마다 더하는 사람 나이
const YEARLY_AFTER_TWO: Record<PetKind, number> = {
  'dog-small': 4,
  'dog-medium': 4.5,
  'dog-large': 5.5,
  cat: 4,
};

/** 개월 수를 받아 사람 나이(정수)를 돌려준다. */
export function toHumanAge(kind: PetKind, months: number): number {
  const years = months / 12;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + YEARLY_AFTER_TWO[kind] * (years - 2));
}
