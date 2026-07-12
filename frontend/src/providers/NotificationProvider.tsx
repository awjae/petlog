'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { NOTIFICATION_AUTH_CHECK_QUERY } from '@/features/notification/api/notification.api';
import { usePushNotificationRegistration } from '@/features/notification/hooks/usePushNotificationRegistration';

// 인증 없이 접근 가능한 경로. registerPushToken은 로그인 사용자 컨텍스트에서만 의미가
// 있는 mutation이라, 이 목록에 속한 공개 경로에서는 로그인 여부 확인 쿼리 자체를 쏘지
// 않는다 — 그렇지 않으면 비로그인 상태로 공개 페이지(/login 등)에 진입할 때마다
// UNAUTHENTICATED 에러가 발생해 errorLink의 세션 갱신 시도와 /login 강제 새로고침이
// 불필요하게 일어난다.
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy',
]);

/**
 * 앱 전역(ApolloProvider 하위)에 마운트되어, 로그인된 사용자에게만 네이티브 푸시 알림
 * 등록을 트리거한다. 실제 네이티브 권한 요청/토큰 등록 로직은
 * usePushNotificationRegistration에 위임하고, 이 컴포넌트는 "지금 등록을 시도해도 되는
 * 상태인가"(공개 라우트가 아니고, 로그인돼 있는가)만 판단한다.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_PATHS.has(pathname);

  const { data } = useQuery(NOTIFICATION_AUTH_CHECK_QUERY, {
    skip: isPublicRoute,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const isAuthenticated = !isPublicRoute && data?.me != null;

  usePushNotificationRegistration(isAuthenticated);

  return <>{children}</>;
}
