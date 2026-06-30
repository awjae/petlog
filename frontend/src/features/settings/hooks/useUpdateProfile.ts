'use client';

import { useMutation } from '@apollo/client/react';
import { UPDATE_PROFILE_MUTATION } from '../api/settings.mutations';

export function useUpdateProfile() {
  const [mutate, { loading, error }] = useMutation(UPDATE_PROFILE_MUTATION, {
    update(cache, { data }) {
      if (!data) return;
      // me 루트 필드의 name을 직접 수정 → HomeQuery·SettingsMe 쿼리 캐시 모두 반영
      cache.modify({
        fields: {
          me(existing) {
            return { ...existing, name: data.updateProfile.name };
          },
        },
      });
    },
    onError: () => {},
  });

  async function updateProfile(name: string): Promise<boolean> {
    const result = await mutate({ variables: { input: { name: name.trim() } } }).catch(() => null);
    return result?.data?.updateProfile != null;
  }

  return {
    updateProfile,
    loading,
    error: error ? '저장에 실패했어요. 다시 시도해주세요' : null,
  };
}
