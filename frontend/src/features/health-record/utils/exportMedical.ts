import { periodStart, toLocalDateString } from '@/shared/utils/date';
import { FREQUENCY_LABEL, type Medication } from '@/features/medication/types/medication.types';
import { isMedicationActive } from '@/features/medication/utils/medicationStatus';
import type { Vaccination } from '@/features/medical/types/medical.types';

// 병원 내보내기에 붙이는 투약·접종 요약.
//
// 내보내기는 "병원에서 보여줄 화면"(#72)인데 건강 기록만 담고 있었다. 진료 때 가장 먼저
// 묻는 것은 "지금 먹는 약"과 "접종은 언제 했는지"인데, 그 데이터는 앱에 있으면서 이 화면에는
// 없었다. 투약은 기간과 무관하게 오늘 복용 중인 약을, 접종은 선택한 기간 안의 기록을 보여준다.

export interface MedicationLine {
  id: string;
  name: string;
  /** 주기를 정하지 않았으면 null */
  frequencyLabel: string | null;
  /** 로컬 YYYY-MM-DD */
  since: string;
}

export interface VaccinationLine {
  id: string;
  /** 로컬 YYYY-MM-DD */
  date: string;
  name: string;
  /** 로컬 YYYY-MM-DD, 없으면 null */
  nextDue: string | null;
}

export function activeMedicationLines(
  medications: Medication[],
  now: Date = new Date(),
): MedicationLine[] {
  return medications
    .filter((m) => isMedicationActive(m, now))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((m) => ({
      id: m.id,
      name: m.name || '이름 없는 약',
      frequencyLabel: m.frequency ? FREQUENCY_LABEL[m.frequency] : null,
      since: toLocalDateString(new Date(m.startDate)),
    }));
}

export function vaccinationLinesInPeriod(
  vaccinations: Vaccination[],
  days: number,
  now: Date = new Date(),
): VaccinationLine[] {
  const start = periodStart(days, now).getTime();
  return vaccinations
    .filter((v) => new Date(v.vaccinatedAt).getTime() >= start)
    .sort((a, b) => b.vaccinatedAt.localeCompare(a.vaccinatedAt))
    .map((v) => ({
      id: v.id,
      date: toLocalDateString(new Date(v.vaccinatedAt)),
      name: v.name,
      nextDue: v.nextDueAt ? toLocalDateString(new Date(v.nextDueAt)) : null,
    }));
}
