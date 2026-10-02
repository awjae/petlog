import { describe, expect, it } from 'vitest';
import type { Medication } from '../types/medication.types';
import { isMedicationActive } from './medicationStatus';

// 폼에서 07-30을 고르면 서버에는 2026-07-30T03:00:00Z(= KST 정오)로 저장된다.
const med = (startDate: string, endDate?: string): Medication => ({
  id: 'm1',
  petId: 'p1',
  name: '항생제',
  dosage: '',
  frequency: '하루 2회',
  startDate,
  endDate,
  createdAt: startDate,
  updatedAt: startDate,
});

describe('isMedicationActive', () => {
  const endsToday = med('2026-07-28T03:00:00.000Z', '2026-07-30T03:00:00.000Z');

  it('종료일 저녁(KST 18시)에도 복용 중이다', () => {
    expect(isMedicationActive(endsToday, new Date('2026-07-30T09:00:00Z'))).toBe(true);
  });

  it('종료일 다음 날 0시부터 종료다', () => {
    expect(isMedicationActive(endsToday, new Date('2026-07-30T15:00:00Z'))).toBe(false);
  });

  it('시작일 오전(KST 정오 전)에도 복용 중이다', () => {
    const startsToday = med('2026-07-30T03:00:00.000Z');
    expect(isMedicationActive(startsToday, new Date('2026-07-29T15:30:00Z'))).toBe(true);
  });

  it('시작일 전날은 복용 전이다', () => {
    const startsTomorrow = med('2026-07-31T03:00:00.000Z');
    expect(isMedicationActive(startsTomorrow, new Date('2026-07-30T09:00:00Z'))).toBe(false);
  });
});
