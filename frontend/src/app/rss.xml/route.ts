// filepath: src/app/rss.xml/route.ts
//
// 가이드 글 RSS. 네이버 서치어드바이저는 sitemap과 별도로 RSS를 제출받아 새 글을 수집한다 —
// 국내 반려동물 정보 검색에서 네이버 비중이 커서 sitemap만으로는 부족하다.
// guides.ts 하나를 보므로 글을 추가하면 피드에도 자동으로 들어간다.
import { GUIDES } from '../guides/guides';
import { SITE_NAME, SITE_URL } from '@/shared/config/site';

export const dynamic = 'force-static';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function GET(): Response {
  const items = [...GUIDES]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((guide) => {
      const url = `${SITE_URL}/guides/${guide.slug}`;
      return `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(guide.description)}</description>
      <pubDate>${new Date(`${guide.publishedAt}T00:00:00+09:00`).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME} 반려동물 건강 기록 가이드</title>
    <link>${SITE_URL}/guides</link>
    <description>집에서 남길 수 있는 반려동물 건강 기록을 어떻게 재고, 언제 수의사와 상담해야 하는지 정리한 가이드</description>
    <language>ko</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
