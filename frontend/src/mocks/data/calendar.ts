import type { CalendarEvent, CalendarPet } from '@/features/calendar/types/calendar.types';

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

type MockCalendarData = { me: { pets: CalendarPet[]; calendarEvents: CalendarEvent[] } };

export const mockCalendarData: MockCalendarData = {
  me: {
    pets: [
      { id: 'pet-1', name: '초코', profileImageUrl: null },
      { id: 'pet-2', name: '뭉치', profileImageUrl: null },
    ],
    calendarEvents: [
      // 오늘
      {
        id: 'e-1',
        date: daysFromToday(0),
        type: 'health_record',
        title: '체중 측정',
        subtitle: '3.2 kg',
        petId: 'pet-1',
      },
      {
        id: 'e-2',
        date: daysFromToday(0),
        type: 'health_record',
        title: '식욕 기록',
        subtitle: '잘 먹음',
        petId: 'pet-1',
      },
      {
        id: 'e-3',
        date: daysFromToday(0),
        type: 'health_record',
        title: '체중 측정',
        subtitle: '4.8 kg',
        petId: 'pet-2',
      },
      // 어제
      {
        id: 'e-4',
        date: daysFromToday(-1),
        type: 'medication',
        title: '심장사상충 예방약',
        subtitle: '1정',
        petId: 'pet-2',
      },
      {
        id: 'e-5',
        date: daysFromToday(-1),
        type: 'health_record',
        title: '활동량 기록',
        subtitle: '활발함',
        petId: 'pet-1',
      },
      // 내일
      {
        id: 'e-6',
        date: daysFromToday(1),
        type: 'vaccination',
        title: '광견병 예방접종',
        subtitle: null,
        petId: 'pet-1',
      },
      // 3일 후
      {
        id: 'e-7',
        date: daysFromToday(3),
        type: 'appointment',
        title: '정기 검진 예약',
        subtitle: '우리동네 동물병원',
        petId: 'pet-1',
      },
      {
        id: 'e-8',
        date: daysFromToday(3),
        type: 'medical_event',
        title: '병원 방문',
        subtitle: '피부 검진',
        petId: 'pet-2',
      },
      // 5일 후
      {
        id: 'e-9',
        date: daysFromToday(5),
        type: 'medication',
        title: '관절 영양제',
        subtitle: '2정',
        petId: 'pet-1',
      },
    ],
  },
};
