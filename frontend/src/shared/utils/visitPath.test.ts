import { describe, it, expect } from 'vitest';
import { toVisitPath } from './visitPath';

describe('toVisitPath', () => {
  it('공유 리포트는 토큰을 빼고 남긴다', () => {
    expect(toVisitPath('/share/reports/3f1c9a2b-token')).toBe('/share/reports');
  });

  it.each(['/', '/guides', '/guides/dog-vomit', '/sample-report', '/login', '/register'])(
    '공개 경로 %s는 그대로 남긴다',
    (path) => {
      expect(toVisitPath(path)).toBe(path);
    },
  );

  it.each(['/home', '/pets/1', '/share/reports', '/settings'])('%s는 남기지 않는다', (path) => {
    expect(toVisitPath(path)).toBeNull();
  });
});
