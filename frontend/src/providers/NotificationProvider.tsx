'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { NOTIFICATION_AUTH_CHECK_QUERY } from '@/features/notification/api/notification.api';
import { usePushNotificationRegistration } from '@/features/notification/hooks/usePushNotificationRegistration';
import { isPublicRoute } from '@/shared/config/publicRoutes';

/**
 * 앱 전역(ApolloProvider 하위)에 마운트되어, 로그인된 사용자에게만 네이티브 푸시 알림
 * 등록을 트리거한다. 실제 네이티브 권한 요청/토큰 등록 로직은
 * usePushNotificationRegistration에 위임하고, 이 컴포넌트는 "지금 등록을 시도해도 되는
 * 상태인가"(공개 라우트가 아니고, 로그인돼 있는가)만 판단한다.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  const { data } = useQuery(NOTIFICATION_AUTH_CHECK_QUERY, {
    skip: isPublic,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const isAuthenticated = !isPublic && data?.me != null;

  usePushNotificationRegistration(isAuthenticated);

  return <>{children}</>;
}
