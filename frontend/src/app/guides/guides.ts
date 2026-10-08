// 검색 유입용 공개 가이드 목록.
//
// 허브(/guides), 각 글의 서로 간 링크, sitemap 세 곳이 같은 목록을 본다. 한 곳에
// 글을 추가하고 다른 곳을 빠뜨리면 색인에서 누락되므로 출처를 하나로 둔다.
// 본문은 각 라우트의 page.tsx가 직접 갖는다 — 여기엔 색인에 필요한 메타만 둔다.

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'dog-weight-check',
    title: '강아지 체중 재는 법과 기록 기준',
    description:
      '집에서 강아지 체중을 정확히 재는 방법, 얼마나 자주 재야 하는지, 어느 정도 변화부터 수의사와 상담해야 하는지 정리했습니다.',
  },
  {
    slug: 'pet-temperature',
    title: '강아지·고양이 정상 체온과 집에서 재는 법',
    description:
      '개와 고양이의 정상 체온 범위, 집에서 체온을 재는 방법, 범위를 벗어났을 때 확인할 것을 정리했습니다.',
  },
];

export function findGuide(slug: string): GuideMeta {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) throw new Error(`guides.ts에 없는 slug: ${slug}`);
  return guide;
}

export function otherGuides(slug: string): GuideMeta[] {
  return GUIDES.filter((g) => g.slug !== slug);
}
