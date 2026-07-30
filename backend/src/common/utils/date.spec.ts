import { kstDayRange } from './date';

// 고정 오프셋 계산이라 프로세스 TZ와 무관하게 같은 결과가 나온다.
// 그래서 이 스펙은 TZ를 고정하지 않는다 — 고정이 필요하다면 구현이 TZ에
// 의존한다는 뜻이므로, 그 자체가 회귀 신호다.
describe('kstDayRange', () => {
  it('KST 새벽에도 그날(KST) 구간을 반환한다', () => {
    // UTC 2026-07-29 15:30 = KST 2026-07-30 00:30
    const { start, end } = kstDayRange(new Date('2026-07-29T15:30:00Z'));

    // KST 2026-07-30 00:00 = UTC 2026-07-29 15:00
    expect(start.toISOString()).toBe('2026-07-29T15:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-30T15:00:00.000Z');
  });

  it('KST 정오도 같은 구간에 들어간다', () => {
    // UTC 2026-07-30 03:00 = KST 2026-07-30 12:00
    const { start, end } = kstDayRange(new Date('2026-07-30T03:00:00Z'));

    expect(start.toISOString()).toBe('2026-07-29T15:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-30T15:00:00.000Z');
  });

  it('KST 자정 직전과 직후는 다른 구간이다', () => {
    // KST 2026-07-30 23:59 / 2026-07-31 00:01
    const before = kstDayRange(new Date('2026-07-30T14:59:00Z'));
    const after = kstDayRange(new Date('2026-07-30T15:01:00Z'));

    expect(before.start.toISOString()).toBe('2026-07-29T15:00:00.000Z');
    expect(after.start.toISOString()).toBe('2026-07-30T15:00:00.000Z');
  });

  it('클라이언트가 정오 앵커로 저장한 기록이 그날 구간에 들어간다', () => {
    // 프론트엔드는 로컬 날짜 D를 D 12:00(KST) = D 03:00Z로 저장한다.
    const recordedAt = new Date('2026-07-30T03:00:00Z');

    // KST 2026-07-30 새벽 2시에 조회
    const { start, end } = kstDayRange(new Date('2026-07-29T17:00:00Z'));

    expect(recordedAt >= start && recordedAt < end).toBe(true);
  });
});
