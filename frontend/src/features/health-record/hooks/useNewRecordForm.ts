'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { useSelectedPetStore } from '@/features/pet/stores/selectedPet.store';
import { useLocalToday } from '@/shared/hooks/useLocalToday';
import { localToday } from '@/shared/utils/date';
import type { AppetiteLevel, HealthRecordType } from '../api/health-record.mutations';
import { VALID_TYPES } from '../constants/recordOptions';
import { useCreateHealthRecord } from './useCreateHealthRecord';

// 기록 추가 화면(app/records/new)의 폼 상태와 저장 흐름.
//
// 화면 파일이 701줄이었고 그중 대부분이 상태 선언·검증·제출이었다. 렌더링과 섞여 있으면
// "기록 유형을 하나 추가한다"는 작업에 어디를 고쳐야 하는지 파악하기 어렵다.
// 여기서는 동작을 바꾸지 않고 위치만 옮긴다.

const MAX_SYMPTOMS = 5;
const SYMPTOM_TOAST_MS = 2000;
const SUCCESS_ROUTE_DELAY_MS = 800;

export function useNewRecordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data } = useHomeData();
  const { createHealthRecord, loading: submitting, error } = useCreateHealthRecord();
  const lastSelectedPetId = useSelectedPetStore((s) => s.selectedPetId);
  const setSelectedPetId = useSelectedPetStore((s) => s.setSelectedPetId);

  const petIdFromUrl = params.get('petId');
  const rawType = params.get('type') as HealthRecordType | null;
  const defaultType: HealthRecordType =
    rawType && VALID_TYPES.includes(rawType) ? rawType : 'weight';

  const [petId, setPetId] = useState(petIdFromUrl ?? '');
  const [recordType, setRecordType] = useState<HealthRecordType>(defaultType);
  const [date, setDate] = useState(localToday);
  // max는 렌더 중에 계산하면 하이드레이션에서 서버 값이 굳는다 (useLocalToday 주석 참고).
  const maxDate = useLocalToday();

  const [weight, setWeight] = useState('');
  const [appetite, setAppetite] = useState<AppetiteLevel>('good');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [memo, setMemo] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<1 | 2 | 3 | null>(null);
  const [stoolType, setStoolType] = useState<string | null>(null);
  const [stoolCount, setStoolCount] = useState<1 | 2 | 3 | null>(null);
  const [vomitContent, setVomitContent] = useState<string | null>(null);
  const [vomitCount, setVomitCount] = useState<1 | 2 | 3 | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [success, setSuccess] = useState(false);

  const pets = data?.pets ?? [];

  // pets 목록이 비동기 로딩된 이후 petId가 비어있으면 마지막 선택 반려동물로 동기화
  useEffect(() => {
    if (petId || pets.length === 0) return;
    const defaultPetId = pets.some((p) => p.id === lastSelectedPetId)
      ? lastSelectedPetId
      : pets[0].id;
    setPetId(defaultPetId ?? '');
  }, [pets, petId, lastSelectedPetId]);

  // 반려동물을 바꾸면 다른 화면의 기본 선택도 따라가야 하므로 스토어에 함께 반영한다.
  function handlePetChange(nextPetId: string) {
    setPetId(nextPetId);
    setSelectedPetId(nextPetId);
  }

  function handleTypeChange(type: HealthRecordType) {
    setRecordType(type);
    setMemo('');
    setSymptoms([]);
    setSeverity(null);
    setStoolType(null);
    setStoolCount(null);
    setVomitContent(null);
    setVomitCount(null);
  }

  function handleSymptomToggle(symptom: string) {
    setSymptoms((prev) => {
      if (prev.includes(symptom)) return prev.filter((s) => s !== symptom);
      if (prev.length >= MAX_SYMPTOMS) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), SYMPTOM_TOAST_MS);
        return prev;
      }
      return [...prev, symptom];
    });
  }

  function isValid(): boolean {
    if (!petId) return false;
    switch (recordType) {
      case 'weight':
        return weight.trim() !== '';
      case 'activity':
        return duration.trim() !== '';
      case 'mood':
        return memo.trim() !== '';
      case 'symptom':
        return symptoms.length > 0 && severity !== null;
      case 'stool':
        return stoolType !== null;
      case 'vomit':
        return vomitCount !== null;
      default:
        return true;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;

    const ok = await createHealthRecord({
      petId,
      type: recordType,
      date,
      weight,
      appetite,
      duration,
      distance,
      memo,
      symptoms,
      severity: severity ?? undefined,
      stoolType: stoolType ?? undefined,
      stoolCount: stoolCount ?? undefined,
      vomitContent: vomitContent ?? undefined,
      vomitCount: vomitCount ?? undefined,
    });

    if (ok) {
      setSuccess(true);
      setTimeout(() => router.back(), SUCCESS_ROUTE_DELAY_MS);
    }
  }

  // 수의사 상담을 권해야 하는 입력 조합.
  const showWarning =
    (recordType === 'symptom' && (symptoms.includes('구토') || symptoms.includes('설사'))) ||
    (recordType === 'stool' && stoolType === '혈변') ||
    (recordType === 'vomit' && vomitContent === '피가 섞임');

  const warningText =
    recordType === 'stool'
      ? '혈변이 보일 경우 수의사 상담을 권장해요.'
      : recordType === 'vomit'
        ? '피가 섞인 구토가 보일 경우 수의사 상담을 권장해요.'
        : '해당 증상이 심각하다면 수의사 상담을 권장해요.';

  return {
    pets,
    petId,
    handlePetChange,
    recordType,
    handleTypeChange,
    date,
    setDate,
    maxDate,

    weight,
    setWeight,
    appetite,
    setAppetite,
    duration,
    setDuration,
    distance,
    setDistance,
    memo,
    setMemo,
    symptoms,
    handleSymptomToggle,
    severity,
    setSeverity,
    stoolType,
    setStoolType,
    stoolCount,
    setStoolCount,
    vomitContent,
    setVomitContent,
    vomitCount,
    setVomitCount,

    isValid,
    handleSubmit,
    submitting,
    error,
    success,
    showToast,
    showWarning,
    warningText,
  };
}
