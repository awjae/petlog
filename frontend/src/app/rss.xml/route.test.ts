import { describe, expect, it } from 'vitest';
import { GET } from './route';
import { GUIDES } from '../guides/guides';

describe('rss.xml', () => {
  it('모든 가이드 글을 최신순으로 담는다', async () => {
    const xml = await GET().text();
    for (const guide of GUIDES) {
      expect(xml).toContain(`<link>https://petlog.quest/guides/${guide.slug}</link>`);
    }
    const order = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1]);
    const expected = [...GUIDES]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((g) => `https://petlog.quest/guides/${g.slug}`);
    expect(order).toEqual(expected);
  });

  // pubDate는 RFC 822 형식이어야 한다. ISO 문자열을 넣으면 피드 검증기가 거부한다.
  it('pubDate를 RFC 822 형식(KST 0시)으로 쓴다', async () => {
    const xml = await GET().text();
    expect(xml).toMatch(/<pubDate>\w{3}, \d{2} \w{3} \d{4} 15:00:00 GMT<\/pubDate>/);
  });

  it('XML 특수문자를 이스케이프한다', async () => {
    const xml = await GET().text();
    // 제목·설명의 '&'가 날것으로 들어가면 피드 전체가 파싱 오류가 된다.
    expect(xml.replace(/&(amp|lt|gt|quot);/g, '')).not.toMatch(/&/);
  });
});
