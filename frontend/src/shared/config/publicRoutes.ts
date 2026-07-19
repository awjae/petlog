// 인증 없이 접근 가능한 경로. 이 목록은 두 곳에서 함께 참조한다:
//   1. NotificationProvider — 공개 경로에서는 로그인 여부 확인 쿼리 자체를 쏘지 않는다.
//   2. errorLink — 공개 경로에서 발생한 UNAUTHENTICATED는 세션 만료가 아니라 "원래
//      비로그인 방문자"이므로, 토큰 갱신 실패 시에도 /login으로 강제 이동시키지 않는다.
// 두 곳의 판단 기준이 어긋나면(예: 한쪽만 갱신) 공개 페이지에서 비로그인 방문자가
// 갑자기 /login으로 튕기는 회귀가 생기므로 반드시 이 파일 하나만 수정해서 동기화한다.
const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy',
]);

// prefix 매칭이 필요한 공개 경로 — 동적 세그먼트를 포함한다.
// 예: /share/reports/[shareToken] (완전 공개, 인증 가드 없음)
const PUBLIC_PATH_PREFIXES = ['/share/'];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
