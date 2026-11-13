// 가이드 글별 OG 카드. 카카오톡·문자로 링크를 보내면 미리보기에 글 제목이 보여야 눌러볼
// 이유가 생긴다 — 루트의 공용 카드("Petlog")만으로는 무슨 글인지 알 수 없다.
//
// 각 가이드 폴더의 opengraph-image.tsx가 이 함수를 slug로 부른다. 루트 카드와 같은 색·로고를
// 써서 같은 서비스로 보이게 한다.
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SITE_NAME } from '@/shared/config/site';
import { findGuide } from './guides';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function guideOgImage(slug: string): ImageResponse {
  const guide = findGuide(slug);
  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'main-logo.png'));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: '#f4f0e6',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logoSrc} width={64} height={64} style={{ borderRadius: 16 }} />
        <div style={{ marginLeft: 16, fontSize: 36, fontWeight: 700, color: '#2b2620' }}>
          {/* 텍스트 노드를 하나로 둔다 — 둘로 나뉘면 Satori가 display: flex를 요구하며 500을 낸다. */}
          {`${SITE_NAME} 가이드`}
        </div>
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, color: '#2b2620', lineHeight: 1.3 }}>
        {guide.title}
      </div>
      <div style={{ fontSize: 30, color: '#6b6255' }}>반려동물 건강 기록 · petlog.quest</div>
    </div>,
    { ...size },
  );
}
