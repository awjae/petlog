'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import {
  NOTIFICATION_PREFERENCE_QUERY,
  UPDATE_NOTIFICATION_PREFERENCE_MUTATION,
  type UpdateNotificationPreferenceInput,
} from '../api/notification.api';

export function useNotificationPreference() {
  const { data, loading, error } = useQuery(NOTIFICATION_PREFERENCE_QUERY);
  const [mutate, { loading: updating }] = useMutation(UPDATE_NOTIFICATION_PREFERENCE_MUTATION, {
    optimisticResponse: (vars) => ({
      updateNotificationPreference: {
        vaccinationDueEnabled: data?.notificationPreference.vaccinationDueEnabled ?? true,
        appointmentReminderEnabled: data?.notificationPreference.appointmentReminderEnabled ?? true,
        weeklyCheckinEnabled: data?.notificationPreference.weeklyCheckinEnabled ?? true,
        medicationReminderEnabled: data?.notificationPreference.medicationReminderEnabled ?? true,
        ...vars.input,
      },
    }),
    // NotificationPreference에는 id가 없어 Apollo가 정규화하지 못한다. 그래서 mutation 결과가
    // 조회 쿼리(notificationPreference)에 자동으로 반영되지 않아, 스위치가 새로고침 전까지
    // 그대로 보였다. 결과(낙관적 응답 포함)를 조회 쿼리 캐시에 직접 쓴다.
    update(cache, { data: result }) {
      if (!result) return;
      cache.writeQuery({
        query: NOTIFICATION_PREFERENCE_QUERY,
        data: { notificationPreference: result.updateNotificationPreference },
      });
    },
  });

  async function updatePreference(input: UpdateNotificationPreferenceInput): Promise<boolean> {
    const result = await mutate({ variables: { input } }).catch(() => null);
    return result?.data?.updateNotificationPreference != null;
  }

  return {
    preference: data?.notificationPreference,
    loading,
    error: error != null,
    updating,
    updatePreference,
  };
}
