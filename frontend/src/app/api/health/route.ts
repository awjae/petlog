// filepath: src/app/api/health/route.ts

import { NextResponse } from 'next/server';

/**
 * AWS App Runner 헬스체크 엔드포인트.
 *
 * 이 파일은 App Router의 파일시스템 라우트(route handler)이며,
 * next.config.ts의 `/api/:path*` rewrite(백엔드 프록시)보다 우선 매칭된다.
 * 따라서 이 경로는 백엔드로 프록시되지 않고 프론트엔드 컨테이너 자체의
 * 생존 여부만 확인한다. 경로 문자열(`/api/health`)은 infra의 CDKTF
 * App Runner 헬스체크 설정과 반드시 일치해야 하므로 임의로 변경하지 않는다.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
