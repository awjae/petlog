import { describe, expect, it } from 'vitest';
import { activeMedicationLines, vaccinationLinesInPeriod } from './exportMedical';
import type { Medication } from '@/features/medication/types/medication.types';
import type { Vaccination } from '@/features/medical/types/medical.types';

// TZ=Asia/Seoul 고정 (vitest.config.ts). 날짜는 로컬 정오 앵커로 저장된다.
const at = (ymd: string) => new Date(`${ymd}T12:00:00`).toISOString();
const NOW = new Date('2026-11-13T15:00:00');

const med = (id: string, start: string, end: string | undefined, extra: Partial<Medication> = {}) =>
  ({
    id,
    petId: 'p',
    name: id,
    dosage: '-',
    frequency: 'onceDaily',
    startDate: at(start),
    endDate: end && at(end),
    createdAt: '',
    updatedAt: '',
    ...extra,
  }) as Medication;

const vac = (id: string, date: string, next?: string) =>
  ({
    id,
    petId: 'p',
    name: id,
    vaccinatedAt: at(date),
    nextDueAt: next && at(next),
    createdAt: '',
    updatedAt: '',
  }) as Vaccination;

describe('activeMedicationLines', () => {
  it('오늘 복용 중인 약만, 먼저 시작한 순서로 담는다 (종료일 당일 포함)', () => {
    const lines = activeMedicationLines(
      [
        med('심장약', '2026-10-01', undefined),
        med('항생제', '2026-11-01', '2026-11-13'),
        med('끝난 약', '2026-09-01', '2026-11-12'),
        med('내일부터', '2026-11-14', undefined),
      ],
      NOW,
    );
    expect(lines.map((l) => l.name)).toEqual(['심장약', '항생제']);
    expect(lines[0]).toMatchObject({ frequencyLabel: '하루 1회', since: '2026-10-01' });
  });

  it('주기·이름이 없어도 빈칸으로 두지 않는다', () => {
    const [line] = activeMedicationLines(
      [med('m', '2026-11-01', undefined, { name: '', frequency: null })],
      NOW,
    );
    expect(line).toMatchObject({ name: '이름 없는 약', frequencyLabel: null });
  });
});

describe('vaccinationLinesInPeriod', () => {
  it('기간 안의 접종만 최신순으로, 다음 예정일과 함께 담는다', () => {
    const lines = vaccinationLinesInPeriod(
      [
        vac('종합백신', '2026-09-01', '2027-09-01'),
        vac('광견병', '2026-11-10'),
        vac('오래전', '2026-01-01'),
      ],
      90,
      NOW,
    );
    expect(lines).toEqual([
      { id: '광견병', date: '2026-11-10', name: '광견병', nextDue: null },
      { id: '종합백신', date: '2026-09-01', name: '종합백신', nextDue: '2027-09-01' },
    ]);
  });
});
