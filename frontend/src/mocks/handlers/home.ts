import { graphql, HttpResponse } from 'msw';
import { mockHomeData } from '../data/home';
import { getMockRecentRecords, getMockTodayCount } from '../data/record-store';

// Phase 전환 방법:
//   Phase 1 (온보딩): mockHomeData → mockHomeDataPhase1 으로 교체
//   Phase 3 (AI 해금): mockHomeData 유지 + page.tsx의 DEMO_PHASE = 3 으로 설정
export const homeHandlers = [
  graphql.query('HomeQuery', () => {
    if (!mockHomeData.me) {
      return HttpResponse.json({ data: mockHomeData });
    }

    const pets = mockHomeData.me.pets.map((pet) => {
      const newRecords = getMockRecentRecords(pet.id, 3);
      const combined = [...newRecords, ...pet.recentHealthRecords].slice(0, 3);
      const addedToday = getMockTodayCount(pet.id);

      return {
        ...pet,
        recentHealthRecords: combined,
        todayRecordCount: pet.todayRecordCount + addedToday,
      };
    });

    return HttpResponse.json({
      data: { me: { ...mockHomeData.me, pets } },
    });
  }),
];
