'use client';

import { useQuery } from '@apollo/client/react';
import { SETTINGS_ME_QUERY } from '../api/settings.queries';

export function useCurrentUser() {
  const { data, loading, error } = useQuery(SETTINGS_ME_QUERY);

  return {
    name: data?.me.name ?? null,
    email: data?.me.email ?? '',
    loading,
    error: error ? '사용자 정보를 불러오지 못했어요' : null,
  };
}
