import { cache } from 'react';
import type { PublicSharedReport } from '../types/report-share.types';

// 서버(RSC / generateMetadata) 전용 조회.
//
// 클라이언트용 reportSharePublic.api.ts는 상대 경로 '/api/...'를 쓴다. 그건 브라우저에서만
// 의미가 있고(next.config.ts의 rewrites가 처리), 서버에서는 절대 URL이 필요하다.
//
// NEXT_PUBLIC_API_URL은 런타임 환경변수가 아니라 이미지 빌드 시점에 --build-arg로 주입돼
// 번들에 인라인된다(infra/stacks/frontend-stack.ts의 주석 참고). NEXT_PUBLIC_ 접두사가
// 붙은 값은 서버 번들에도 함께 인라인되므로 여기서 읽을 수 있다.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 실패를 구분하지 않고 null로 뭉갠다. 이 함수의 유일한 용도는 메타데이터/OG 이미지
 * 생성이고, 그 단계에서 할 수 있는 대응은 "기본값으로 떨어지기"뿐이다. 사용자에게
 * 보일 에러 분기(not-found / network)는 클라이언트 훅이 그대로 담당한다.
 *
 * cache(): 같은 요청 안에서 generateMetadata가 여러 번 호출돼도 백엔드 요청은 한 번이다.
 */
export const getSharedReportForMetadata = cache(
  async (token: string): Promise<PublicSharedReport | null> => {
    if (!API_URL) return null;

    try {
      const res = await fetch(`${API_URL}/report-shares/${encodeURIComponent(token)}`, {
        // 공유 중단 즉시 미리보기도 사라져야 하므로 캐시하지 않는다.
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return (await res.json()) as PublicSharedReport;
    } catch {
      return null;
    }
  },
);
