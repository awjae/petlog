import { describe, expect, it } from 'vitest';
import { isPublicRoute } from './publicRoutes';

describe('isPublicRoute', () => {
  it.each(['/', '/login', '/register', '/privacy', '/terms', '/guides', '/guides/pet-temperature'])(
    '%s는 공개 경로다',
    (path) => {
      expect(isPublicRoute(path)).toBe(true);
    },
  );

  it.each(['/home', '/pets', '/reports/abc', '/settings'])('%s는 공개 경로가 아니다', (path) => {
    expect(isPublicRoute(path)).toBe(false);
  });
});
