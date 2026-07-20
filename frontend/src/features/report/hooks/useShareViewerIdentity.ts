'use client';

import { useQuery } from '@apollo/client/react';
import { SHARE_VIEWER_QUERY } from '../api/report-share.queries';

interface UseShareViewerIdentityReturn {
  isMember: boolean;
  name: string | null;
  loading: boolean;
}

/**
 * 공유 리포트 열람 페이지에서 방문자가 로그인된 Petlog 회원인지 조용히 확인한다.
 * 비로그인 방문자는 GraphQL UNAUTHENTICATED 에러를 정상적으로 받는데,
 * errorPolicy:'all'로 컴포넌트가 throw 되지 않고 data=undefined로만 처리되게 한다.
 *
 * 이 훅을 쓰는 라우트는 반드시 shared/config/publicRoutes.ts의 공개 경로 목록에
 * 포함돼 있어야 한다 — 그렇지 않으면 errorLink가 UNAUTHENTICATED를 세션 만료로 오인해
 * 비로그인 방문자를 /login으로 강제 이동시킨다.
 */
export function useShareViewerIdentity(): UseShareViewerIdentityReturn {
  const { data, loading } = useQuery(SHARE_VIEWER_QUERY, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  return {
    isMember: data?.me != null,
    name: data?.me?.name ?? null,
    loading,
  };
}
