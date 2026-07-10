// filepath: src/app/opengraph-image.tsx
//
// 카카오톡/문자 등으로 링크를 공유할 때 노출되는 OG 카드 이미지.
// 로고 + 서비스명 + 한 줄 설명만 담은 심플한 구성으로 유지한다.
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SITE_NAME } from '@/shared/config/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'main-logo.png'));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f0e6',
      }}
    >
      <img src={logoSrc} width={180} height={180} style={{ borderRadius: 40 }} />
      <div
        style={{
          marginTop: 32,
          fontSize: 72,
          fontWeight: 700,
          color: '#2b2620',
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 32,
          color: '#6b6255',
        }}
      >
        반려동물 건강 기록 · AI 건강 리포트
      </div>
    </div>,
    { ...size },
  );
}
