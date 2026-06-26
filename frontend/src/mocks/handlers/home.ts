import { graphql, HttpResponse } from 'msw';
// Phase 전환 방법:
//   Phase 1 (온보딩): mockHomeData → mockHomeDataPhase1 으로 교체
//   Phase 3 (AI 해금): mockHomeData 유지 + page.tsx의 DEMO_PHASE = 3 으로 설정
import { mockHomeData } from '../data/home';

export const homeHandlers = [
  graphql.query('HomeQuery', () => {
    return HttpResponse.json({ data: mockHomeData });
  }),
];
