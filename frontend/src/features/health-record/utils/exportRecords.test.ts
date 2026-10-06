import { describe, expect, it } from 'vitest';
import type { HealthRecord } from '../types/health-record.types';
import { buildRecordExport } from './exportRecords';

// TZ=Asia/Seoul 고정 (vitest.config.ts의 test.env). 기간 경계가 실제 날짜에 따라
// 흔들리지 않도록 "오늘"을 고정해서 넘긴다.
const NOW = new Date('2026-09-18T15:00:00+09:00');

/** 로컬 정오에 저장되는 실제 기록 형식을 흉내낸다 (records/new의 recordedAt). */
function record(date: string, overrides: Partial<HealthRecord> = {}): HealthRecord {
  return {
    id: `${date}-${overrides.type ?? 'weight'}-${overrides.numValue ?? ''}`,
    type: 'weight',
    recordedAt: new Date(`${date}T12:00:00+09:00`).toISOString(),
    numValue: 4,
    textValue: null,
    note: null,
    ...overrides,
  };
}

describe('buildRecordExport', () => {
  it('기간 밖 기록을 버린다 — 경계 당일은 포함한다', () => {
    const records = [
      record('2026-09-18'),
      record('2026-08-20'), // 30일 기간의 첫날
      record('2026-08-19'), // 하루 밖
    ];

    const result = buildRecordExport(records, 30, NOW);

    expect(result.rows.map((r) => r.date)).toEqual(['2026-09-18', '2026-08-20']);
    expect(result.from).toBe('2026-08-20');
    expect(result.to).toBe('2026-09-18');
  });

  it('최신순으로 정렬한다', () => {
    const records = [record('2026-09-01'), record('2026-09-15'), record('2026-09-10')];

    const result = buildRecordExport(records, 90, NOW);

    expect(result.rows.map((r) => r.date)).toEqual(['2026-09-15', '2026-09-10', '2026-09-01']);
  });

  it('유형별 건수를 많은 순으로 센다', () => {
    const records = [
      record('2026-09-18', { type: 'vomit', numValue: 1 }),
      record('2026-09-17', { type: 'vomit', numValue: 2 }),
      record('2026-09-16', { type: 'vomit', numValue: 1 }),
      record('2026-09-15', { type: 'weight', numValue: 4 }),
    ];

    const result = buildRecordExport(records, 90, NOW);

    expect(result.countByType).toEqual([
      { type: 'vomit', label: '구토', count: 3 },
      { type: 'weight', label: '체중', count: 1 },
    ]);
  });

  it('기간 내 첫 체중과 마지막 체중의 변화를 낸다', () => {
    const records = [
      record('2026-09-18', { numValue: 3.8 }),
      record('2026-09-01', { numValue: 4.1 }),
    ];

    const result = buildRecordExport(records, 90, NOW);

    // 부동소수점 잔재(-0.30000000000000027)가 화면에 나가면 안 된다.
    expect(result.weight).toEqual({ first: 4.1, last: 3.8, change: -0.3 });
  });

  it('체중 기록이 1건뿐이면 변화를 만들지 않는다', () => {
    const result = buildRecordExport([record('2026-09-18', { numValue: 4 })], 90, NOW);
    expect(result.weight).toBeNull();
  });

  it('기간 밖 체중은 변화 계산에서도 빠진다', () => {
    const records = [
      record('2026-09-18', { numValue: 3.8 }),
      record('2026-01-01', { numValue: 9.9 }), // 90일 밖
    ];

    const result = buildRecordExport(records, 90, NOW);

    expect(result.weight).toBeNull();
  });

  it('표기는 앱 화면과 같은 buildSummary를 쓴다', () => {
    const records = [
      record('2026-09-18', { type: 'weight', numValue: 4.2 }),
      record('2026-09-17', { type: 'vomit', numValue: 2, textValue: '노란 액체' }),
    ];

    const result = buildRecordExport(records, 90, NOW);

    expect(result.rows[0].summary).toBe('4.2 kg');
    expect(result.rows[1].summary).toBe('노란 액체 · 2-3회');
  });

  it('기록이 없으면 빈 표와 빈 집계를 낸다', () => {
    const result = buildRecordExport([], 90, NOW);

    expect(result.rows).toEqual([]);
    expect(result.countByType).toEqual([]);
    expect(result.weight).toBeNull();
  });
});
