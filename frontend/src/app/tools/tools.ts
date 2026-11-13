// 검색 유입용 공개 계산 도구 목록. guides.ts와 같은 이유로 허브(/tools)·sitemap이 이 목록
// 하나를 본다 — 한 곳에 추가하고 다른 곳을 빠뜨리면 색인에서 누락된다.

export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'pet-age',
    title: '강아지·고양이 나이 계산기 (사람 나이 환산)',
    description:
      '반려동물 나이를 사람 나이로 환산합니다. 강아지는 체구별로, 고양이는 별도 기준으로 계산합니다.',
  },
  {
    slug: 'daily-calories',
    title: '강아지·고양이 하루 칼로리·사료량 계산기',
    description:
      '체중과 생애 단계(성장기·중성화·감량)로 하루 권장 칼로리를 구하고, 사료 칼로리로 하루 급여량을 계산합니다.',
  },
];

export function findTool(slug: string): ToolMeta {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`tools.ts에 없는 slug: ${slug}`);
  return tool;
}
