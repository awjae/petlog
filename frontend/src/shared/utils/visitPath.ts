// 방문 로그에 남길 경로. 집계 대상이 아니면 null.
//
// 가입 이전 유입 퍼널(가이드 글·공유 리포트 → 가입)을 보기 위한 것이라 로그인 후 화면은 세지 않는다.
// 공유 리포트는 토큰이 곧 열람 권한이므로 토큰을 뺀 `/share/reports`로 접어서 남긴다.
const PUBLIC_PATH = /^\/(guides(\/.*)?|sample-report|login|register)?$/;
const SHARED_REPORT_PATH = /^\/share\/reports\/[^/]+$/;

export function toVisitPath(pathname: string): string | null {
  if (SHARED_REPORT_PATH.test(pathname)) return '/share/reports';
  return PUBLIC_PATH.test(pathname) ? pathname : null;
}
