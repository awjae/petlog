import type { CalendarQueryQuery } from '@/generated/graphql';

type MeData = NonNullable<CalendarQueryQuery['me']>;

export type CalendarPet = MeData['pets'][number];
export type CalendarEvent = MeData['calendarEvents'][number];
export type CalendarEventType = CalendarEvent['type'];
export type CalendarView = 'week' | 'month';

export type PetColorMap = Record<string, string>;

export const PET_COLORS = [
  'var(--color-pet-1)',
  'var(--color-pet-2)',
  'var(--color-pet-3)',
  'var(--color-pet-4)',
  'var(--color-pet-5)',
] as const;

export const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; icon: string; color: string }
> = {
  health_record: { label: '건강 기록', icon: '📋', color: 'var(--color-text-secondary)' },
  vaccination: { label: '예방접종', icon: '💉', color: 'var(--color-primary)' },
  medication: { label: '투약', icon: '💊', color: 'var(--color-warning)' },
  appointment: { label: '병원 예약', icon: '📅', color: 'var(--color-success)' },
  medical_event: { label: '병원 방문', icon: '🏥', color: 'var(--color-danger)' },
};

export function buildPetColorMap(pets: CalendarPet[]): PetColorMap {
  return Object.fromEntries(pets.map((pet, i) => [pet.id, PET_COLORS[i % PET_COLORS.length]]));
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export function getWeekRange(baseDate: Date): { startDate: string; endDate: string } {
  const day = baseDate.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(baseDate);
  mon.setDate(baseDate.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { startDate: toDateString(mon), endDate: toDateString(sun) };
}

export function getWeekDays(startDate: string): string[] {
  const mon = new Date(startDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateString(d);
  });
}

export function getMonthGridDays(baseDate: Date): string[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 월요일 기준 그리드 시작
  const firstDow = firstDay.getDay();
  const diffToMon = firstDow === 0 ? -6 : 1 - firstDow;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + diffToMon);

  // 일요일 기준 그리드 끝
  const lastDow = lastDay.getDay();
  const diffToSun = lastDow === 0 ? 0 : 7 - lastDow;
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + diffToSun);

  const days: string[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    days.push(toDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function getMonthRange(monthGridDays: string[]): { startDate: string; endDate: string } {
  return { startDate: monthGridDays[0], endDate: monthGridDays[monthGridDays.length - 1] };
}

export function buildWeekHeaderLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (s.getMonth() === e.getMonth()) {
    return `${s.getFullYear()}년 ${s.getMonth() + 1}월`;
  }
  return `${s.getMonth() + 1}월 - ${e.getMonth() + 1}월`;
}
