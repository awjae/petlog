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
 * 값을 SVG 좌표로 옮긴다. 큰 값이 위(작은 y)로 간다.
 * values는 2개 이상이어야 한다 (toWeightTrend가 보장).
 */
export function toChartCoords(
  values: number[],
  width: number,
  height: number,
  padding: number,
): Array<{ x: number; y: number }> {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const stepX = (width - padding * 2) / (values.length - 1);

  return values.map((value, index) => ({
    x: padding + index * stepX,
    // 값이 모두 같으면 범위가 0이라 나누면 NaN이 된다. 가운데 수평선으로 둔다.
    y: range === 0 ? height / 2 : padding + (1 - (value - min) / range) * (height - padding * 2),
  }));
}
