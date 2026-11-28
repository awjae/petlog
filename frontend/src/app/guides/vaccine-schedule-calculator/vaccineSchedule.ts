import { addToDate } from '@/shared/utils/date';

// 생년월일 → 기초 예방접종 예정일.
//
// 국내 동물병원에서 흔히 안내하는 기초 접종 순서를 따른다. 병원마다 시작 주차·간격·
// 포함 백신이 조금씩 달라서 "대략 언제쯤"을 미리 보는 용도다. 화면에도 그렇게 적는다.

export type VaccineSpecies = 'dog' | 'cat';

interface Dose {
  week: number;
  vaccines: string;
}

const SCHEDULE: Record<VaccineSpecies, Dose[]> = {
  dog: [
    { week: 6, vaccines: '종합백신(DHPPL) 1차 · 코로나 장염 1차' },
    { week: 8, vaccines: '종합백신 2차 · 코로나 장염 2차' },
    { week: 10, vaccines: '종합백신 3차 · 켄넬코프 1차' },
    { week: 12, vaccines: '종합백신 4차 · 켄넬코프 2차 · 인플루엔자 1차' },
    { week: 14, vaccines: '종합백신 5차 · 인플루엔자 2차' },
    { week: 16, vaccines: '광견병 · 항체가 검사' },
  ],
  cat: [
    { week: 8, vaccines: '종합백신(FVRCP) 1차' },
    { week: 11, vaccines: '종합백신 2차 · 백혈병(FeLV, 선택) 1차' },
    { week: 14, vaccines: '종합백신 3차 · 백혈병(선택) 2차' },
    { week: 16, vaccines: '광견병' },
  ],
};

export interface ScheduledDose {
  order: number;
  date: string; // YYYY-MM-DD
  vaccines: string;
}

export function vaccineSchedule(species: VaccineSpecies, birthDate: string): ScheduledDose[] {
  return SCHEDULE[species].map((dose, i) => ({
    order: i + 1,
    date: addToDate(birthDate, { days: dose.week * 7 }),
    vaccines: dose.vaccines,
  }));
}
