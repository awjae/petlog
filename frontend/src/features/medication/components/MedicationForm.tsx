'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Loader2, Check } from 'lucide-react';
import { SelectBottomSheet } from '@/shared/components/SelectBottomSheet';
import { DatePickerSheet, formatDateKo } from '@/shared/components/DatePickerSheet';
import { FREQUENCY_OPTIONS } from '../types/medication.types';
import type { CreateMedicationFormInput } from '../types/medication.types';
import styles from './MedicationForm.module.css';

interface MedicationFormProps {
  petId: string;
  onSubmit: (input: CreateMedicationFormInput) => void;
  loading: boolean;
  error: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function MedicationForm({ petId, onSubmit, loading, error }: MedicationFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [freqSheetOpen, setFreqSheetOpen] = useState(false);
  const [datePicker, setDatePicker] = useState<'startDate' | 'endDate' | null>(null);

  const isValid = startDate.length > 0 && (!endDate || endDate >= startDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit({
      petId,
      name: name.trim() || undefined,
      frequency: frequency || undefined,
      startDate,
      endDate: endDate || undefined,
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>시작일</h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePicker('startDate')}
            aria-label="투약 시작일 선택"
          >
            <span className={startDate ? undefined : styles.dateTriggerPlaceholder}>
              {startDate ? formatDateKo(startDate) : '날짜 선택'}
            </span>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            약 이름 <span className={styles.optional}>(선택)</span>
          </h2>
          <input
            type="text"
            className={styles.textInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 심장사상충 예방약"
            maxLength={100}
            aria-label="약 이름 (선택)"
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            투약 주기 <span className={styles.optional}>(선택)</span>
          </h2>
          <button
            type="button"
            className={`${styles.selectTrigger} ${frequency ? styles.selectTriggerActive : ''}`}
            onClick={() => setFreqSheetOpen(true)}
            aria-haspopup="listbox"
            aria-expanded={freqSheetOpen}
          >
            <span className={frequency ? styles.selectValue : styles.selectPlaceholder}>
              {frequency || '주기 선택'}
            </span>
            <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            종료일 <span className={styles.optional}>(선택)</span>
          </h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePicker('endDate')}
            aria-label="투약 종료일 선택"
          >
            <span className={endDate ? undefined : styles.dateTriggerPlaceholder}>
              {endDate ? formatDateKo(endDate) : '날짜 선택 (선택)'}
            </span>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </section>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isValid || loading}
            aria-disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
                저장 중...
              </>
            ) : (
              <>
                <Check size={18} aria-hidden="true" />
                저장하기
              </>
            )}
          </button>
        </div>
      </form>

      <SelectBottomSheet
        isOpen={freqSheetOpen}
        onClose={() => setFreqSheetOpen(false)}
        title="투약 주기"
        options={FREQUENCY_OPTIONS}
        value={frequency}
        onChange={setFrequency}
      />

      <DatePickerSheet
        isOpen={datePicker === 'startDate'}
        onClose={() => setDatePicker(null)}
        value={startDate}
        onChange={setStartDate}
        max={today()}
        title="시작일 선택"
      />

      <DatePickerSheet
        isOpen={datePicker === 'endDate'}
        onClose={() => setDatePicker(null)}
        value={endDate || startDate}
        onChange={setEndDate}
        min={startDate}
        title="종료일 선택"
      />
    </>
  );
}
