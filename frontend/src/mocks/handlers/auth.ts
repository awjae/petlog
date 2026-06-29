import { http, HttpResponse } from 'msw';

// authFetch('/auth/refresh') → fetch('/api/auth/refresh') (상대 URL)
// MSW는 상대 URL을 현재 origin 기준으로 처리하므로 절대 경로 없이 작성
export const authHandlers = [
  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({ message: 'ok' });
  }),
];
