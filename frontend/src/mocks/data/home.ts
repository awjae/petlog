import type { HomeQueryQuery } from '@/generated/graphql';

// me 쿼리는 전부 id를 함께 조회한다(features/settings/api/settings.queries.ts 주석 참고).
// 목업도 같은 사용자를 가리켜야 Apollo 캐시가 실제 환경과 같은 방식으로 정규화된다.
export const MOCK_USER_ID = 'user-1';

// Phase 1 — 온보딩: 기록이 전혀 없는 신규 사용자
// 사용법: homeHandlers에서 mockHomeData → mockHomeDataPhase1 으로 교체
export const mockHomeDataPhase1: HomeQueryQuery = {
  me: {
    id: MOCK_USER_ID,
    recordDates: [],
    pets: [
      {
        id: 'pet-1',
        name: '초코',
        species: 'dog',
        breed: '말티즈',
        birthDate: '2021-03-15',
        profileImageUrl: null,
        recentWeight: null,
        todayRecordCount: 0,
        totalHealthRecordCount: 0,
        recentHealthRecords: [],
      },
    ],
    upcomingSchedules: [
      {
        id: 'sched-1',
        petId: 'pet-1',
        petName: '초코',
        petProfileImageUrl: null,
        type: 'vaccination',
        title: '광견병 예방접종',
        dueDate: '2026-07-03T09:00:00.000Z',
      },
    ],
  },
};

// Phase 2 (기본) — 습관 형성: 1-29건
function pastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString();
  });
}

export const mockHomeData: HomeQueryQuery = {
  me: {
    id: MOCK_USER_ID,
    recordDates: pastDays(7),
    pets: [
      {
        id: 'pet-1',
        name: '초코',
        species: 'dog',
        breed: '말티즈',
        birthDate: '2021-03-15',
        profileImageUrl: null,
        recentWeight: {
          value: 3.2,
          recordedAt: '2026-06-20T09:00:00.000Z',
        },
        todayRecordCount: 2,
        totalHealthRecordCount: 12,
        recentHealthRecords: [
          {
            id: 'hr-1',
            type: 'weight',
            recordedAt: '2026-06-20T09:00:00.000Z',
            numValue: 3.2,
            textValue: null,
          },
          {
            id: 'hr-2',
            type: 'appetite',
            recordedAt: '2026-06-19T08:00:00.000Z',
            numValue: null,
            textValue: '잘 먹음',
          },
          {
            id: 'hr-3',
            type: 'activity',
            recordedAt: '2026-06-18T07:00:00.000Z',
            numValue: 30,
            textValue: '1.2',
          },
          {
            id: 'hr-4',
            type: 'mood',
            recordedAt: '2026-06-17T08:00:00.000Z',
            numValue: null,
            textValue: '오늘 유독 활발하게 놀았어요',
          },
          {
            id: 'hr-5',
            type: 'weight',
            recordedAt: '2026-06-15T09:00:00.000Z',
            numValue: 3.1,
            textValue: null,
          },
        ],
      },
      {
        id: 'pet-2',
        name: '뭉치',
        species: 'cat',
        breed: '코리안 숏헤어',
        birthDate: '2020-07-22',
        profileImageUrl: null,
        recentWeight: {
          value: 4.8,
          recordedAt: '2026-06-18T10:00:00.000Z',
        },
        todayRecordCount: 0,
        totalHealthRecordCount: 3,
        recentHealthRecords: [
          {
            id: 'hr-4',
            type: 'weight',
            recordedAt: '2026-06-18T10:00:00.000Z',
            numValue: 4.8,
            textValue: null,
          },
        ],
      },
    ],
    upcomingSchedules: [
      {
        id: 'sched-1',
        petId: 'pet-1',
        petName: '초코',
        petProfileImageUrl: null,
        type: 'vaccination',
        title: '광견병 예방접종',
        dueDate: '2026-06-28T09:00:00.000Z',
      },
      {
        id: 'sched-2',
        petId: 'pet-2',
        petName: '뭉치',
        petProfileImageUrl: null,
        type: 'medication',
        title: '심장사상충 예방약',
        dueDate: '2026-07-01T09:00:00.000Z',
      },
    ],
  },
};
