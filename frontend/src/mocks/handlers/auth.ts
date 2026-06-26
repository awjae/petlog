import { http, HttpResponse } from 'msw';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const authHandlers = [
  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({ message: 'ok' });
  }),
];
