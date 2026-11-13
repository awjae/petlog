'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { MEDICATIONS_QUERY } from '../api/medication.queries';
import {
  CREATE_MEDICATION_MUTATION,
  DELETE_MEDICATION_MUTATION,
  END_MEDICATION_MUTATION,
} from '../api/medication.mutations';
import { localToday } from '@/shared/utils/date';
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

// 종료일 없이 등록한 약은 매일 아침·저녁 알림이 끝없이 나간다. 일찍 끊은 약을 멈추는 방법이
// 삭제뿐이면 병원 내보내기에 쓰일 투약 이력까지 사라지므로, 종료일만 오늘로 바꾼다.
// 저장 형식은 등록과 같은 로컬 정오다(useCreateMedication).
export function useEndMedicationToday() {
  const [mutate, { loading }] = useMutation(END_MEDICATION_MUTATION, {
    refetchQueries: ['Medications', 'HomeQuery', 'CalendarQuery'],
  });

  async function endMedicationToday(id: string): Promise<boolean> {
    const endDate = new Date(`${localToday()}T12:00:00`).toISOString();
    const result = await mutate({ variables: { id, input: { endDate } } }).catch(() => null);
    return result?.data?.updateMedication != null;
  }

  return { endMedicationToday, loading };
}
