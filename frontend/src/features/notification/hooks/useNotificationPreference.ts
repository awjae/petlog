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
        ...vars.input,
      },
    }),
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
