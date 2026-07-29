import type { Metadata } from 'next';
import { getSharedReportForMetadata } from '@/features/report/api/reportSharePublic.server';
import { formatPeriodRange } from '@/features/report/utils/reportFormat';
import { SITE_NAME } from '@/shared/config/site';
import { SharedReportClient } from './SharedReportClient';

// 이 페이지만 서버 컴포넌트로 두는 이유:
//
// 카카오톡·슬랙 같은 링크 프리뷰 봇은 JavaScript를 실행하지 않는다. 페이지 전체가
// 'use client'이면 봇이 받는 HTML에는 리포트도, 리포트별 <head>도 없어서 어떤 링크를
// 공유해도 미리보기가 루트 레이아웃의 기본값으로 똑같이 나온다. 공유가 이 서비스의
// 유일한 획득 경로라 이건 제품 문제다.
//
// Next.js는 'use client' 파일에서 metadata/generateMetadata export를 금지하므로,
// login/page.tsx + LoginPageClient.tsx와 같은 방식으로 껍데기만 서버에 남기고 화면은
// 클라이언트 컴포넌트에 위임한다. 데이터 레이어(Apollo/REST 훅)는 그대로다.

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const report = await getSharedReportForMetadata(shareToken);

  // 색인은 막되 robots.txt로는 막지 않는다. robots.txt에 /share/를 disallow로 넣으면
  // 카카오톡·슬랙·페이스북 프리뷰 봇도 함께 차단돼 미리보기 자체가 사라진다. 반면
  // 이 noindex 메타는 검색 엔진만 따르고 프리뷰 봇은 무시하므로, "미리보기는 되고
  // 검색에는 안 뜨는" 상태가 된다. 공유 링크는 추측 불가능한 토큰으로 보호되는
  // 준(準)비공개 자원이라 검색 색인은 원하지 않는다.
  const robots = { index: false, follow: false };

  if (!report) {
    return {
      title: '공유된 건강 리포트',
      description: `${SITE_NAME}에서 공유된 반려동물 건강 리포트입니다.`,
      robots,
    };
  }

  const period = formatPeriodRange(report.periodStart, report.periodEnd);
  const title = `${report.petName}의 건강 리포트`;
  const description = report.overview?.trim()
    ? `${period} · ${report.overview.trim()}`
    : `${period} 기록을 바탕으로 만든 ${SITE_NAME} AI 건강 리포트입니다.`;

  return {
    title,
    description,
    robots,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
      // images는 지정하지 않는다 — 같은 라우트의 opengraph-image.tsx를 Next가
      // 자동으로 og:image로 붙인다.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedReportPage({ params }: PageProps) {
  const { shareToken } = await params;

  return <SharedReportClient shareToken={shareToken} />;
}
