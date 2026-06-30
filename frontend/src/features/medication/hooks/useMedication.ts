'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { MEDICATIONS_QUERY } from '../api/medication.queries';
import {
  CREATE_MEDICATION_MUTATION,
  DELETE_MEDICATION_MUTATION,
} from '../api/medication.mutations';
import type { CreateMedicationFormInput } from '../types/medication.types';

export function useMedications(petId: string) {
  return useQuery(MEDICATIONS_QUERY, {
    variables: { petId },
    fetchPolicy: 'cache-and-network',
  });
}

export function useCreateMedication() {
  const [error, setError] = useState('');
  const [mutate, { loading }] = useMutation(CREATE_MEDICATION_MUTATION, {
    refetchQueries: ['Medications', 'HomeQuery', 'CalendarQuery'],
    onError: () => setError('저장에 실패했어요. 다시 시도해주세요.'),
  });

  async function createMedication(input: CreateMedicationFormInput): Promise<boolean> {
    setError('');
    const startDateIso = new Date(input.startDate + 'T12:00:00').toISOString();
    const endDateIso = input.endDate
      ? new Date(input.endDate + 'T12:00:00').toISOString()
      : undefined;
    const result = await mutate({
      variables: {
        input: {
          petId: input.petId,
          name: input.name,
          dosage: '-',
          frequency: input.frequency,
          startDate: startDateIso,
          endDate: endDateIso,
        },
      },
    }).catch(() => null);
    return result?.data?.createMedication != null;
  }

  return { createMedication, loading, error };
}

export function useDeleteMedication() {
  const [mutate, { loading }] = useMutation(DELETE_MEDICATION_MUTATION, {
    refetchQueries: ['Medications', 'CalendarQuery'],
  });
  return {
    deleteMedication: (id: string) => mutate({ variables: { id } }),
    loading,
  };
}
