import type { HealthRecordType } from '@/generated/graphql';
import type { HealthRecord } from '@/features/health-record/types/health-record.types';
import { periodStart } from '@/features/health-record/utils/exportRecords';

// ponytail: 최근 90일 고정. 기간 선택(30일/1년)은 사용자가 원하면 그때 추가
export const TREND_DAYS = 90;

export interface TrendPoint {
  recordedAt: string;
  value: number;
}

export interface RecordTrend {
  /** 오래된 순 */
  points: TrendPoint[];
  /** 마지막 값 - 첫 값 (기록 단위, 소수 둘째 자리) */
  change: number;
}

/**
 * 오늘을 포함한 최근 90일의 type 수치 기록을 오래된 순으로 돌려준다.
 * 하루에 한 점이며, 점이 2개 미만이면 변화를 그릴 수 없으므로 null.
 *
 * 개수가 아니라 기간으로 자른다. 가로축이 날짜 간격이라 오래된 기록 하나가 섞이면
 * 최근 기록들이 오른쪽 끝에 몰려 보이지 않는다.
 */
export function toRecordTrend(
  records: HealthRecord[],
  type: HealthRecordType,
  now: Date = new Date(),
): RecordTrend | null {
  const windowStart = periodStart(TREND_DAYS, now);

  const sorted = records
    .filter(
      (record): record is HealthRecord & { numValue: number } =>
        record.type === type &&
        record.numValue != null &&
        new Date(record.recordedAt).getTime() >= windowStart.getTime(),
    )
    .map((record) => ({ recordedAt: record.recordedAt, value: record.numValue }))
    // 같은 날 기록은 recordedAt이 같아 정렬로 순서가 안 바뀐다. 서버의 최신순(입력 역순)을
    // 먼저 뒤집어야 같은 날 안에서도 입력 순서가 된다.
    .reverse()
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  // 하루에 한 점만 그린다. 같은 날 점이 여럿이면 같은 x에 세로로 쌓이므로, 그날 마지막에
  // 입력한 값을 쓴다 (평균이 아니라 실제 기록한 값이 보이게).
  // ponytail: 하루 마지막 값. 혈당처럼 하루 여러 번 재는 값의 평균·범위는 실사용 데이터를 보고 추가
  const points = [
    ...new Map(sorted.map((point) => [new Date(point.recordedAt).toDateString(), point])).values(),
  ];

  if (points.length < 2) return null;

  // 3.2 - 3.0 = 0.20000000000000018 이 그대로 화면에 나가지 않게 반올림한다.
  const change = Math.round((points[points.length - 1].value - points[0].value) * 100) / 100;
  return { points, change };
}

/**
 * 점을 SVG 좌표로 옮긴다. x는 기록 날짜 간격에 비례하고, 큰 값이 위(작은 y)로 간다.
 * points는 2개 이상이어야 한다 (toRecordTrend가 보장).
 */
export function toChartCoords(
  points: TrendPoint[],
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
