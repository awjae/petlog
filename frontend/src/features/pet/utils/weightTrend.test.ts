import { describe, expect, it } from 'vitest';
import type { HealthRecord } from '@/features/health-record/types/health-record.types';
import { toChartCoords, toWeightTrend } from './weightTrend';

function record(overrides: Partial<HealthRecord>): HealthRecord {
  return {
    id: 'hr',
    type: 'weight',
    recordedAt: '2026-09-01T03:00:00.000Z',
    numValue: 3,
    textValue: null,
    note: null,
    ...overrides,
  };
}

describe('toWeightTrend', () => {
  it('체중 기록만 오래된 순으로 모은다', () => {
    // 서버는 최신순으로 내려준다.
    const trend = toWeightTrend([
      record({ id: 'a', recordedAt: '2026-09-03T03:00:00.000Z', numValue: 3.2 }),
      record({ id: 'b', type: 'activity', recordedAt: '2026-09-02T03:00:00.000Z', numValue: 30 }),
      record({ id: 'c', recordedAt: '2026-09-01T03:00:00.000Z', numValue: 3.0 }),
    ]);

    expect(trend?.points.map((p) => p.value)).toEqual([3.0, 3.2]);
  });

  it('값이 없는 체중 기록은 건너뛴다', () => {
    const trend = toWeightTrend([
      record({ recordedAt: '2026-09-01T03:00:00.000Z', numValue: 3.0 }),
      record({ recordedAt: '2026-09-02T03:00:00.000Z', numValue: null }),
    ]);

    expect(trend).toBeNull();
  });

  it('점이 2개 미만이면 null이다', () => {
    expect(toWeightTrend([])).toBeNull();
    expect(toWeightTrend([record({})])).toBeNull();
  });

  it('최근 10회만 남긴다', () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      record({
        id: `hr-${i}`,
        recordedAt: new Date(Date.UTC(2026, 8, i + 1, 3)).toISOString(),
        numValue: 3 + i / 10,
      }),
    );

    const trend = toWeightTrend(records);

    expect(trend?.points).toHaveLength(10);
    expect(trend?.points[0].recordedAt).toBe('2026-09-03T03:00:00.000Z');
  });

  it('변화량의 부동소수 오차를 반올림한다', () => {
    const trend = toWeightTrend([
      record({ recordedAt: '2026-09-01T03:00:00.000Z', numValue: 3.0 }),
      record({ recordedAt: '2026-09-02T03:00:00.000Z', numValue: 3.2 }),
    ]);

    expect(trend?.change).toBe(0.2);
  });
});

describe('toChartCoords', () => {
  it('큰 값이 위, 작은 값이 아래에 온다', () => {
    const [low, high] = toChartCoords(
      [point('2026-09-01T03:00:00.000Z', 3.0), point('2026-09-02T03:00:00.000Z', 3.2)],
      100,
      50,
      5,
    );

    expect(low).toEqual({ x: 5, y: 45 });
    expect(high).toEqual({ x: 95, y: 5 });
  });

  it('점 사이 가로 간격이 실제 날짜 간격에 비례한다', () => {
    // 9/1 → 9/2(1일) → 9/11(9일). 순번 간격이었다면 가운데 점이 x=50에 온다.
    const coords = toChartCoords(
      [
        point('2026-09-01T03:00:00.000Z', 3.0),
        point('2026-09-02T03:00:00.000Z', 3.1),
        point('2026-09-11T03:00:00.000Z', 3.2),
      ],
      100,
      50,
      5,
    );

    expect(coords[0].x).toBe(5);
    expect(coords[1].x).toBeCloseTo(14);
    expect(coords[2].x).toBe(95);
  });

  it('값이 모두 같아도 NaN 없이 가운데 수평선이 된다', () => {
    const coords = toChartCoords(
      [
        point('2026-09-01T03:00:00.000Z', 3.1),
        point('2026-09-02T03:00:00.000Z', 3.1),
        point('2026-09-03T03:00:00.000Z', 3.1),
      ],
      100,
      50,
      5,
    );

    expect(coords.map((c) => c.y)).toEqual([25, 25, 25]);
  });

  // 기록 시각은 날짜 + 정오로 저장돼 같은 날 기록끼리는 recordedAt이 같다.
  it('모두 같은 날 기록이어도 NaN 없이 가운데에 모인다', () => {
    const coords = toChartCoords(
      [point('2026-09-01T03:00:00.000Z', 3.0), point('2026-09-01T03:00:00.000Z', 3.2)],
      100,
      50,
      5,
    );

    expect(coords.map((c) => c.x)).toEqual([50, 50]);
  });
});

function point(recordedAt: string, value: number) {
  return { recordedAt, value };
}
