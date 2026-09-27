import { describe, expect, it } from 'vitest';
import type { HealthRecordType } from '@/generated/graphql';
import { TYPE_LABEL, buildSummary, isHealthRecordType } from './health-record.types';

describe('buildSummary', () => {
  // 단위가 빠지면 화면에 "320"만 남아 혈당인지 음수량인지 구분되지 않는다.
  it.each([
    ['glucose', 320, '320 mg/dL'],
    ['temperature', 38.5, '38.5°C'],
    ['waterIntake', 450, '450 mL'],
    ['weight', 4.2, '4.2 kg'],
  ] as const)('%s — 숫자에 단위를 붙인다', (type, numValue, expected) => {
    expect(buildSummary(type, numValue, null)).toBe(expected);
  });

  it.each(['glucose', 'temperature', 'waterIntake'] as const)(
    '%s — numValue가 없으면 빈 문자열',
    (type) => {
      expect(buildSummary(type, null, null)).toBe('');
    },
  );
});

describe('기록 유형 목록', () => {
  // 유형이 추가됐는데 라벨이나 판정 함수가 따라오지 않으면 화면에 raw enum 값이 찍힌다.
  it.each(['glucose', 'temperature', 'waterIntake'] as const)('%s — 한국어 라벨이 있다', (type) => {
    expect(TYPE_LABEL[type]).toBeTruthy();
    expect(TYPE_LABEL[type]).not.toBe(type);
  });

  it('URL 쿼리로 들어온 새 유형을 기록 유형으로 인정한다', () => {
    expect(isHealthRecordType('glucose')).toBe(true);
    expect(isHealthRecordType('waterIntake')).toBe(true);
    expect(isHealthRecordType('bloodPressure')).toBe(false);
  });

  it('모든 유형이 요약 문자열을 만든다 — default 폴백으로 조용히 새지 않는다', () => {
    const types = Object.keys(TYPE_LABEL) as HealthRecordType[];
    const numericOnly: HealthRecordType[] = ['weight', 'glucose', 'temperature', 'waterIntake'];
    for (const type of types) {
      const summary = numericOnly.includes(type)
        ? buildSummary(type, 1, null)
        : buildSummary(type, 1, '값');
      expect(summary, `${type}의 요약이 비어 있다`).not.toBe('');
    }
  });
});
