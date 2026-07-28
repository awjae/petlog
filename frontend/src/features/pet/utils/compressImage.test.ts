import { describe, expect, it } from 'vitest';
import { calcTargetSize } from './compressImage';

// compressImage 본체는 canvas / createImageBitmap에 의존해 jsdom에서 의미 있게
// 검증할 수 없다(브라우저마다 인코더 지원이 달라서 실제로 확인해야 하는 것도 그
// 차이다). 여기서는 순수 함수인 calcTargetSize만 다룬다.

describe('calcTargetSize', () => {
  it('긴 변이 한도를 넘으면 비율을 유지해 축소한다', () => {
    expect(calcTargetSize(3000, 2000, 1024)).toEqual({ width: 1024, height: 683 });
  });

  it('세로 사진은 높이가 긴 변이 된다', () => {
    expect(calcTargetSize(2000, 3000, 1024)).toEqual({ width: 683, height: 1024 });
  });

  it('한도 이하인 사진은 확대하지 않고 그대로 둔다', () => {
    // 아바타는 96px로 표시되지만 원본을 늘리면 용량만 커지고 화질은 나아지지 않는다.
    expect(calcTargetSize(400, 300, 1024)).toEqual({ width: 400, height: 300 });
  });

  it('긴 변이 한도와 정확히 같으면 건드리지 않는다', () => {
    expect(calcTargetSize(1024, 512, 1024)).toEqual({ width: 1024, height: 512 });
  });

  it('축소 결과는 정수다', () => {
    // canvas.width에 소수를 넣으면 잘려서 그린 크기와 어긋난다.
    const { width, height } = calcTargetSize(1999, 1333, 1024);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
  });

  it('극단적으로 납작한 사진도 짧은 변이 0이 되지 않는다', () => {
    const { height } = calcTargetSize(8000, 20, 1024);
    expect(height).toBeGreaterThanOrEqual(1);
  });
});
