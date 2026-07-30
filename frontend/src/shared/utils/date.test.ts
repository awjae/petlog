import { afterEach, describe, expect, it, vi } from 'vitest';
import { localToday, toLocalDateString } from './date';

// 모든 테스트는 TZ=Asia/Seoul 고정으로 실행된다 (vitest.config.ts).
// 이 로직은 "UTC 기준으로 날짜를 접으면 하루가 밀린다"는 문제를 막는 것이 목적이라,
// 타임존이 흔들리면 검증 자체가 무의미해진다.

afterEach(() => {
  vi.useRealTimers();
});

describe('toLocalDateString', () => {
  it('UTC 자정 직전 시각을 서울 날짜로 접는다', () => {
    // 2026-07-25T15:30:00Z = 서울 2026-07-26 00:30
    expect(toLocalDateString(new Date('2026-07-25T15:30:00Z'))).toBe('2026-07-26');
  });

  it('월/일을 두 자리로 채운다', () => {
    expect(toLocalDateString(new Date('2026-01-05T00:00:00+09:00'))).toBe('2026-01-05');
  });
});

describe('localToday', () => {
  // 이 프로젝트가 실제로 겪은 버그. 서울 새벽 0~9시에는 UTC 날짜가 아직 어제라,
  // toISOString()으로 오늘을 구하면 기본 날짜가 하루 전으로 잡히고 max 속성이
  // 오늘을 막아버렸다.
  it('서울 새벽 0시 30분에도 오늘 날짜를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T15:30:00Z')); // 서울 07-30 00:30

    expect(localToday()).toBe('2026-07-30');
    expect(new Date().toISOString().split('T')[0]).toBe('2026-07-29'); // 기존 방식
  });

  it('서울 정오에는 UTC 방식과 결과가 같다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T03:00:00Z')); // 서울 07-30 12:00

    expect(localToday()).toBe('2026-07-30');
  });
});
