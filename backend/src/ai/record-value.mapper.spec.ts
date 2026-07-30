import { toAppetiteLevel, toActivityLevel } from './record-value.mapper';

describe('toAppetiteLevel', () => {
  // 프론트 APPETITE_LABEL이 textValue에 저장하는 값 그대로
  it.each([
    ['잘 먹음', 'good'],
    ['보통', 'normal'],
    ['안 먹음', 'poor'],
  ])('실제 저장 값 %s를 %s로 변환한다', (stored, expected) => {
    expect(toAppetiteLevel(stored)).toBe(expected);
  });

  it('저장된 적 없는 값은 버린다', () => {
    // 이전 구현이 DB에 있다고 가정했던 값들. 실제로는 쓰인 적이 없고,
    // 무엇보다 이것들이 전부 poor로 떨어지면서 모든 식사 기록이
    // "식욕 부진"으로 리포트에 들어갔다.
    expect(toAppetiteLevel('high')).toBeNull();
    expect(toAppetiteLevel('none')).toBeNull();
    expect(toAppetiteLevel('low')).toBeNull();
  });

  it('normal은 우연히 맞던 값이 아니라 한국어 보통으로만 나온다', () => {
    expect(toAppetiteLevel('normal')).toBeNull();
    expect(toAppetiteLevel('보통')).toBe('normal');
  });

  it('null과 빈 문자열을 버린다', () => {
    expect(toAppetiteLevel(null)).toBeNull();
    expect(toAppetiteLevel('')).toBeNull();
  });
});

describe('toActivityLevel', () => {
  it('등급 값은 통과시킨다', () => {
    expect(toActivityLevel('high')).toBe('high');
    expect(toActivityLevel('normal')).toBe('normal');
    expect(toActivityLevel('low')).toBe('low');
  });

  it('거리 문자열을 등급으로 넘기지 않는다', () => {
    // 프론트는 산책 기록의 textValue에 거리(km)를 넣는다. 이전 구현은 이걸
    // ActivityLevel로 맹목 캐스팅해 '3.5' 같은 값을 그대로 ChatGPT에 보냈다.
    expect(toActivityLevel('3.5')).toBeNull();
    expect(toActivityLevel('0')).toBeNull();
    expect(toActivityLevel('12')).toBeNull();
  });

  it('null과 빈 문자열을 버린다', () => {
    expect(toActivityLevel(null)).toBeNull();
    expect(toActivityLevel('')).toBeNull();
  });
});
