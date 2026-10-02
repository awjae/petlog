import type { HealthRecordType } from '@/generated/graphql';
import { toLocalDateString } from '@/shared/utils/date';
import { TYPE_LABEL, buildSummary, type HealthRecord } from '../types/health-record.types';

// 병원에 보여줄 기간. 기본 90일은 체중 그래프(weightTrend.TREND_DAYS)와 맞춘다 —
// 같은 반려동물 화면을 오간 사용자가 "최근"의 의미를 다시 배우지 않아도 되게 한다.
export const EXPORT_PERIODS = [30, 90, 180] as const;
export type ExportPeriodDays = (typeof EXPORT_PERIODS)[number];
export const DEFAULT_EXPORT_PERIOD: ExportPeriodDays = 90;

export interface ExportRow {
  id: string;
  /** 로컬 기준 YYYY-MM-DD */
  date: string;
  type: HealthRecordType;
  typeLabel: string;
  /** "4.2 kg", "노란 액체 · 2-3회" 등 앱 화면과 동일한 표기 */
  summary: string;
  note: string | null;
}

export interface WeightSummary {
  first: number;
  last: number;
  /** 마지막 - 처음 (kg, 소수 둘째 자리) */
  change: number;
}

export interface RecordExport {
  /** 기간 시작/끝 (로컬 YYYY-MM-DD, 양끝 포함) */
  from: string;
  to: string;
  /** 최신순 */
  rows: ExportRow[];
  /** 건수가 많은 유형부터 */
  countByType: { type: HealthRecordType; label: string; count: number }[];
  /** 체중 기록이 2건 미만이면 null */
  weight: WeightSummary | null;
}

/**
 * 기간의 시작 경계. 오늘을 포함해 days일이므로 days - 1을 뺀다.
 * 기록 시각이 로컬 날짜의 정오로 저장되므로 경계도 로컬 0시로 잡는다
 * (recordTrend.toRecordTrend도 이 경계를 쓴다).
 */
export function periodStart(days: number, now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

/**
 * 기간 안의 기록을 병원에서 훑어보기 좋은 표로 정리한다.
 *
 * 타임라인처럼 날짜별 카드로 묶지 않는다 — 수의사가 보는 건 "이 기간에 무슨 일이
 * 있었나"라서 한 줄에 한 기록인 표가 훨씬 빨리 읽힌다.
 */
export function buildRecordExport(
  records: HealthRecord[],
  days: number,
  now: Date = new Date(),
): RecordExport {
  const start = periodStart(days, now);
  const inPeriod = records.filter((r) => new Date(r.recordedAt).getTime() >= start.getTime());

  const rows: ExportRow[] = inPeriod
    .map((r) => ({
      id: r.id,
      date: toLocalDateString(new Date(r.recordedAt)),
      type: r.type,
      typeLabel: TYPE_LABEL[r.type],
      summary: buildSummary(r.type, r.numValue ?? null, r.textValue ?? null),
      note: r.note ?? null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const counts = new Map<HealthRecordType, number>();
  for (const r of inPeriod) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);

  return {
    from: toLocalDateString(start),
    to: toLocalDateString(now),
    rows,
    countByType: Array.from(counts.entries())
      .map(([type, count]) => ({ type, label: TYPE_LABEL[type], count }))
      .sort((a, b) => b.count - a.count),
    weight: summarizeWeight(inPeriod),
  };
}

/**
 * 기간 내 첫 체중과 마지막 체중. 수의사가 표에서 제일 먼저 찾는 값이라 따로 뽑는다.
 */
function summarizeWeight(records: HealthRecord[]): WeightSummary | null {
  const weights = records
    .filter(
      (r): r is HealthRecord & { numValue: number } => r.type === 'weight' && r.numValue != null,
    )
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  if (weights.length < 2) return null;

  const first = weights[0].numValue;
  const last = weights[weights.length - 1].numValue;
  // 3.2 - 3.0 = 0.20000000000000018 이 그대로 화면에 나가지 않게 반올림한다.
  return { first, last, change: Math.round((last - first) * 100) / 100 };
}
