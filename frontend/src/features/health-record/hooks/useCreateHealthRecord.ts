'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import {
  CREATE_HEALTH_RECORD_MUTATION,
  type HealthRecordType,
} from '../api/health-record.mutations';
import type { AppetiteChoice } from '../types/health-record.types';
import { mutationFailureMessage } from '@/lib/apollo/mutationFailure';

const APPETITE_LABEL: Record<AppetiteChoice, string> = {
  good: '잘 먹음',
  normal: '보통',
  bad: '안 먹음',
};

export interface CreateHealthRecordFormInput {
  petId: string;
  type: HealthRecordType;
  date: string;
  // weight
  weight?: string;
  // appetite
  appetite?: AppetiteChoice;
  // activity
  duration?: string;
  distance?: string;
  // mood / 공통 메모
  memo?: string;
  // symptom
  symptoms?: string[];
  severity?: 1 | 2 | 3;
  // stool
  stoolType?: string;
  stoolCount?: 1 | 2 | 3;
  // vomit
  vomitContent?: string;
  vomitCount?: 1 | 2 | 3;
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
    case 'symptom':
      return {
        ...base,
        textValue: input.symptoms?.join(', '),
        numValue: input.severity,
        note: input.memo || undefined,
      };
    case 'stool':
      return {
        ...base,
        textValue: input.stoolType,
        numValue: input.stoolCount ?? undefined,
        note: input.memo || undefined,
      };
    case 'vomit':
      return {
        ...base,
        textValue: input.vomitContent || undefined,
        numValue: input.vomitCount,
        note: input.memo || undefined,
      };
    default:
      return base;
  }
}

export function useCreateHealthRecord() {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(CREATE_HEALTH_RECORD_MUTATION, {
    refetchQueries: ['HomeQuery', 'HealthRecords', 'CalendarQuery'],
    // 기록은 산책 중·병원처럼 연결이 불안정한 곳에서 저장되는 일이 많다. 실패 이유에
    // 따라 사용자가 할 일이 다르므로(재시도 / 재로그인 / 연결 대기) 문구를 구분한다.
    onError: (err) => setError(mutationFailureMessage(err)),
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
