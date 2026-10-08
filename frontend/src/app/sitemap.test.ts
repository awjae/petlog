import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { GUIDES } from './guides/guides';

// 가이드를 추가하고 sitemap 등록을 빠뜨리면 그 글은 색인되지 않는다. 화면에는
// 아무 이상이 없어서 "검색 유입이 없다"로만 나타나는, 조용히 실패하는 종류다.
describe('sitemap', () => {
  const urls = sitemap().map((entry) => entry.url);

  it('모든 가이드 글이 등록된다', () => {
    for (const guide of GUIDES) {
      expect(urls).toContain(`https://petlog.quest/guides/${guide.slug}`);
    }
  });

  it('가이드 허브도 등록된다', () => {
    expect(urls).toContain('https://petlog.quest/guides');
  });

  it('인증이 필요한 라우트는 넣지 않는다', () => {
    expect(urls.some((url) => url.includes('/home') || url.includes('/records'))).toBe(false);
  });
});
