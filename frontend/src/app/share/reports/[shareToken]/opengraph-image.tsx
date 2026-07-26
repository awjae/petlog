// 공유 링크별 OG 카드. 루트의 opengraph-image.tsx(서비스 소개 고정 이미지)를
// 이 라우트에서만 덮어써서, 카카오톡 미리보기에 어떤 반려동물의 리포트인지 드러낸다.
//
// 한글 렌더링: next/og의 기본 폰트로 한글이 나오는지 배포본(petlog.quest)의 루트 OG
// 이미지를 실제로 받아 확인했다. 컨테이너에서도 정상이라 별도 폰트 임베드는 하지 않는다.
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSharedReportForMetadata } from '@/features/report/api/reportSharePublic.server';
import { formatPeriodRange } from '@/features/report/utils/reportFormat';
import { SITE_NAME } from '@/shared/config/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ShareOpengraphImage({ params }: { params: { shareToken: string } }) {
  const report = await getSharedReportForMetadata(params.shareToken);

  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'main-logo.png'));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const heading = report ? `${report.petName}의 건강 리포트` : '공유된 건강 리포트';
  const period = report ? formatPeriodRange(report.periodStart, report.periodEnd) : null;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 96px',
        backgroundColor: '#f4f0e6',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src={logoSrc} width={72} height={72} style={{ borderRadius: 18 }} />
        <div style={{ fontSize: 36, fontWeight: 700, color: '#2b2620' }}>{SITE_NAME}</div>
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 68,
          fontWeight: 700,
          color: '#2b2620',
          lineHeight: 1.25,
        }}
      >
        {heading}
      </div>

      {period && <div style={{ marginTop: 20, fontSize: 34, color: '#6b6255' }}>{period}</div>}

      <div style={{ marginTop: 44, fontSize: 28, color: '#8a8073' }}>
        건강 기록으로 만든 AI 리포트
      </div>
    </div>,
    { ...size },
  );
}
