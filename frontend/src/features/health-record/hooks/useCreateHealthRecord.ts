'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import {
  CREATE_HEALTH_RECORD_MUTATION,
  type HealthRecordType,
} from '../api/health-record.mutations';

type AppetiteLevel = 'good' | 'normal' | 'bad';

const APPETITE_LABEL: Record<AppetiteLevel, string> = {
  good: '잘 먹음',
  normal: '보통',
  bad: '안 먹음',
};

export interface CreateHealthRecordFormInput {
  petId: string;
  type: HealthRecordType;
  date: string;
  weight?: string;
  appetite?: AppetiteLevel;
  duration?: string;
  distance?: string;
  memo?: string;
}

function buildVariables(input: CreateHealthRecordFormInput) {
  const recordedAt = new Date(input.date + 'T12:00:00').toISOString();
  const base = { petId: input.petId, type: input.type, recordedAt };

  switch (input.type) {
    case 'weight':
      return { ...base, numValue: parseFloat(input.weight ?? '0'), note: input.memo || undefined };
    case 'appetite':
      return {
        ...base,
        textValue: APPETITE_LABEL[input.appetite ?? 'normal'],
        note: input.memo || undefined,
      };
    case 'activity':
      return {
        ...base,
        numValue: parseFloat(input.duration ?? '0'),
        textValue: input.distance || undefined,
        note: input.memo || undefined,
      };
    case 'mood':
      return { ...base, textValue: input.memo };
    default:
      return base;
  }
}

export function useCreateHealthRecord() {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(CREATE_HEALTH_RECORD_MUTATION, {
    refetchQueries: ['HomeQuery'],
    onError: () => setError('저장에 실패했어요. 다시 시도해주세요'),
  });

  async function createHealthRecord(input: CreateHealthRecordFormInput): Promise<boolean> {
    setError('');
    const result = await mutate({
      variables: { input: buildVariables(input) },
    }).catch(() => null);

    return result?.data?.createHealthRecord != null;
  }

  return { createHealthRecord, loading, error };
}
