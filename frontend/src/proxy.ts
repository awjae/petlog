import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/pets', '/records', '/reports', '/settings'];
const AUTH_ONLY_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('access_token');

  // 로그인 상태에서 랜딩·인증 화면 → 앱으로
  if (hasToken && (pathname === '/' || AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p)))) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 비로그인 상태에서 보호된 경로 → 로그인으로
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!hasToken && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
