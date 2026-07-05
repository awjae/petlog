// filepath: src/app/api/health/route.ts

import { NextResponse } from 'next/server';

/**
 * 프론트엔드 컨테이너 자체의 헬스체크 엔드포인트.
 *
 * 이 파일은 App Router의 파일시스템 라우트(route handler)이며,
 * next.config.ts의 `/api/:path*` rewrite(백엔드 프록시)보다 우선 매칭된다.
 * 따라서 이 경로는 백엔드로 프록시되지 않고 프론트엔드 컨테이너 자체의
 * 생존 여부만 확인한다.
 *
 * 주의: ECS Fargate + ALB 전환 이후 이 경로는 **공유 ALB를 통해서는 도달할 수 없다** — ALB
 * 리스너 규칙이 `/api/*` 전부를 backend 타겟 그룹으로 먼저 라우팅하기 때문이다(경로 문자열이
 * 같아도 목적지 컨테이너가 다르다). 그래서 frontend ALB 타겟 그룹의 헬스체크 경로는 이 파일이
 * 아니라 `/`를 쓴다(`infra/stacks/backend-stack.ts`의 `frontend-target-group` 참고). 이 파일은
 * 지우지 않는다 — ALB를 거치지 않고 컨테이너에 직접 접근해 생존 여부를 확인해야 할 때
 * (로컬 디버깅, ECS Exec 등)를 위해 남겨둔다.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
