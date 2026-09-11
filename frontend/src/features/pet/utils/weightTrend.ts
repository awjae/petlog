import type { HealthRecord } from '@/features/health-record/types/health-record.types';

// ponytail: 최근 10회 고정. 기간 선택(1개월/3개월)은 사용자가 원하면 그때 추가
const TREND_LIMIT = 10;

export interface WeightPoint {
  recordedAt: string;
  value: number;
}

export interface WeightTrend {
  /** 오래된 순 */
  points: WeightPoint[];
  /** 마지막 값 - 첫 값 (kg, 소수 둘째 자리) */
  change: number;
}

/**
 * 체중 기록만 골라 최근 기록들을 오래된 순으로 돌려준다.
 * 점이 2개 미만이면 변화를 그릴 수 없으므로 null.
 */
export function toWeightTrend(records: HealthRecord[]): WeightTrend | null {
  const points = records
    .filter(
      (record): record is HealthRecord & { numValue: number } =>
        record.type === 'weight' && record.numValue != null,
    )
    .map((record) => ({ recordedAt: record.recordedAt, value: record.numValue }))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-TREND_LIMIT);

  if (points.length < 2) return null;

  // 3.2 - 3.0 = 0.20000000000000018 이 그대로 화면에 나가지 않게 반올림한다.
  const change = Math.round((points[points.length - 1].value - points[0].value) * 100) / 100;
  return { points, change };
}

/**
 * 점을 SVG 좌표로 옮긴다. x는 기록 날짜 간격에 비례하고, 큰 값이 위(작은 y)로 간다.
 * points는 2개 이상이어야 한다 (toWeightTrend가 보장).
 */
export function toChartCoords(
  points: WeightPoint[],
  width: number,
  height: number,
  padding: number,
): Array<{ x: number; y: number }> {
  const times = points.map((point) => new Date(point.recordedAt).getTime());
  const values = points.map((point) => point.value);
  const minTime = Math.min(...times);
  const timeRange = Math.max(...times) - minTime;
  const minValue = Math.min(...values);
  const valueRange = Math.max(...values) - minValue;

  return points.map((_, index) => ({
    // 순번이 아니라 실제 날짜 간격에 맞춘다. 3일 공백과 3개월 공백이 같은 폭으로 그려지면
    // 변화 속도를 잘못 읽게 된다. 기록 시각은 정오로 고정돼 같은 날 기록끼리는 시각이 같다.
    // 모두 같은 날이면 범위가 0이라 나누면 NaN이 되므로 가운데에 둔다.
    x:
      timeRange === 0
        ? width / 2
        : padding + ((times[index] - minTime) / timeRange) * (width - padding * 2),
    // 값이 모두 같으면 같은 이유로 가운데 수평선으로 둔다.
    y:
      valueRange === 0
        ? height / 2
        : padding + (1 - (values[index] - minValue) / valueRange) * (height - padding * 2),
  }));
}
