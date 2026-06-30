'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Loader2, Check } from 'lucide-react';
import { SelectBottomSheet } from '@/shared/components/SelectBottomSheet';
import { DatePickerSheet, formatDateKo } from '@/shared/components/DatePickerSheet';
import { VACCINE_OPTIONS } from '../types/medical.types';
import type { CreateVaccinationFormInput } from '../types/medical.types';
import styles from './VaccinationForm.module.css';

interface VaccinationFormProps {
  petId: string;
  onSubmit: (input: CreateVaccinationFormInput) => void;
  loading: boolean;
  error: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function VaccinationForm({ petId, onSubmit, loading, error }: VaccinationFormProps) {
  const [vaccinatedAt, setVaccinatedAt] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customName, setCustomName] = useState('');
  const [nextDueAt, setNextDueAt] = useState('');
  const [memo, setMemo] = useState('');
  const [vaccineSheetOpen, setVaccineSheetOpen] = useState(false);
  const [datePicker, setDatePicker] = useState<'vaccinatedAt' | 'nextDueAt' | null>(null);

  const isCustom = selectedPreset === '기타';
  const vaccineName = isCustom ? customName.trim() : selectedPreset;
  const displayLabel =
    selectedPreset === ''
      ? '백신 선택'
      : selectedPreset === '기타'
        ? customName.trim() || '기타 (직접 입력)'
        : selectedPreset;

  const isValid = vaccinatedAt.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit({
      petId,
      name: vaccineName || undefined,
      vaccinatedAt,
      nextDueAt: nextDueAt || undefined,
      memo: memo.trim() || undefined,
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>접종일</h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePicker('vaccinatedAt')}
            aria-label="접종일 선택"
          >
            <span className={vaccinatedAt ? undefined : styles.dateTriggerPlaceholder}>
              {vaccinatedAt ? formatDateKo(vaccinatedAt) : '날짜 선택'}
            </span>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            백신 <span className={styles.optional}>(선택)</span>
          </h2>
          <button
            type="button"
            className={`${styles.selectTrigger} ${selectedPreset ? styles.selectTriggerActive : ''}`}
            onClick={() => setVaccineSheetOpen(true)}
            aria-haspopup="listbox"
            aria-expanded={vaccineSheetOpen}
          >
            <span className={selectedPreset ? styles.selectValue : styles.selectPlaceholder}>
              {displayLabel}
            </span>
            <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          {isCustom && (
            <input
              type="text"
              className={styles.textInput}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="백신 이름을 입력하세요"
              maxLength={100}
              aria-label="백신 이름 직접 입력"
              style={{ marginTop: 10 }}
            />
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            다음 접종 예정일 <span className={styles.optional}>(선택)</span>
          </h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePicker('nextDueAt')}
            aria-label="다음 접종 예정일 선택"
          >
            <span className={nextDueAt ? undefined : styles.dateTriggerPlaceholder}>
              {nextDueAt ? formatDateKo(nextDueAt) : '날짜 선택 (선택)'}
            </span>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            메모 <span className={styles.optional}>(선택)</span>
          </h2>
          <textarea
            className={styles.textarea}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="특이사항이 있으면 적어주세요"
            rows={4}
            maxLength={500}
            aria-label="메모 (선택)"
          />
          <p className={styles.charCount}>{memo.length} / 500</p>
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
        isOpen={vaccineSheetOpen}
        onClose={() => setVaccineSheetOpen(false)}
        title="백신 선택"
        options={VACCINE_OPTIONS}
        value={selectedPreset}
        onChange={setSelectedPreset}
      />

      <DatePickerSheet
        isOpen={datePicker === 'vaccinatedAt'}
        onClose={() => setDatePicker(null)}
        value={vaccinatedAt}
        onChange={setVaccinatedAt}
        max={today()}
        title="접종일 선택"
      />

      <DatePickerSheet
        isOpen={datePicker === 'nextDueAt'}
        onClose={() => setDatePicker(null)}
        value={nextDueAt || vaccinatedAt}
        onChange={setNextDueAt}
        min={vaccinatedAt}
        title="다음 접종 예정일 선택"
      />
    </>
  );
}
