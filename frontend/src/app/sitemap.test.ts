import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { GUIDES } from './guides/guides';
import { isPublicRoute } from '@/shared/config/publicRoutes';

// 가이드를 추가하고 sitemap 등록을 빠뜨리면 그 글은 색인되지 않는다. 화면에는
// 아무 이상이 없어서 "검색 유입이 없다"로만 나타나는, 조용히 실패하는 종류다.
describe('sitemap', () => {
  const urls = sitemap().map((entry) => entry.url);

  it('모든 가이드 글이 등록된다', () => {
    for (const guide of GUIDES) {
      expect(urls).toContain(`https://petlog.quest/guides/${guide.slug}`);
    }
  });

  // 반대 방향의 누락. guides.ts에 slug만 추가하고 라우트를 빠뜨리면 sitemap이 404 URL을
  // 검색엔진에 제출한다. 이것도 화면에는 드러나지 않는다.
  it('등록된 모든 가이드 글에 실제 페이지가 있다', () => {
    for (const guide of GUIDES) {
      expect(existsSync(new URL(`./guides/${guide.slug}/page.tsx`, import.meta.url))).toBe(true);
    }
  });

  // 빠뜨리면 카톡 미리보기가 루트 공용 카드로 떨어진다. 화면에는 아무 이상이 없다.
  it('모든 가이드 글에 글 제목이 들어간 OG 이미지가 있다', () => {
    for (const guide of GUIDES) {
      expect(
        existsSync(new URL(`./guides/${guide.slug}/opengraph-image.tsx`, import.meta.url)),
      ).toBe(true);
    }
  });

  it('가이드 허브도 등록된다', () => {
    expect(urls).toContain('https://petlog.quest/guides');
  });

  // 공개 경로에 빠지면 비로그인 방문자가 가이드에서 /login으로 튕길 수 있다.
  it('허브와 모든 가이드 글이 공개 경로로 인식된다', () => {
    expect(isPublicRoute('/guides')).toBe(true);
    for (const guide of GUIDES) {
      expect(isPublicRoute(`/guides/${guide.slug}`)).toBe(true);
    }
  });

  it('인증이 필요한 라우트는 넣지 않는다', () => {
    expect(urls.some((url) => url.includes('/home') || url.includes('/records'))).toBe(false);
  });

  it('모든 가이드 글에 올바른 작성일·수정일이 있고, sitemap lastmod가 수정일이다', () => {
    const entries = sitemap();
    for (const guide of GUIDES) {
      expect(guide.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.updatedAt >= guide.publishedAt).toBe(true);
      const entry = entries.find((e) => e.url.endsWith(`/guides/${guide.slug}`));
      expect(new Date(entry!.lastModified!).toISOString().slice(0, 10)).toBe(guide.updatedAt);
    }
  });
});
