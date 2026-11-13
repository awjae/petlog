'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Loader2, Check } from 'lucide-react';
import { SelectBottomSheet } from '@/shared/components/SelectBottomSheet';
import { DatePickerSheet, formatDateKo } from '@/shared/components/DatePickerSheet';
import { addToDate, localToday } from '@/shared/utils/date';
import { VACCINE_OPTIONS } from '../types/medical.types';
import type { CreateVaccinationFormInput } from '../types/medical.types';
import styles from './VaccinationForm.module.css';

interface VaccinationFormProps {
  petId: string;
  onSubmit: (input: CreateVaccinationFormInput) => void;
  loading: boolean;
  error: string;
}

export function VaccinationForm({ petId, onSubmit, loading, error }: VaccinationFormProps) {
  const [vaccinatedAt, setVaccinatedAt] = useState(localToday);
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

  // 접종 알림(scanAndSendVaccinationDue)은 nextDueAt이 있어야만 나간다. 선택 입력이라 달력을
  // 열어야 하면 대부분 비워두고, 그러면 만들어 둔 알림이 한 번도 울리지 않는다. 흔한 간격 두
  // 가지는 한 번에 고르게 한다 — 접종일 기준이며, 정확한 일정은 병원 안내가 우선이다.
  const nextDuePresets = [
    { label: '2주 후', hint: '기초 접종', value: addToDate(vaccinatedAt, { days: 14 }) },
    { label: '1년 후', hint: '추가 접종', value: addToDate(vaccinatedAt, { years: 1 }) },
  ];

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
          <div className={styles.presetRow}>
            {nextDuePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`${styles.presetChip} ${nextDueAt === preset.value ? styles.presetChipActive : ''}`}
                aria-pressed={nextDueAt === preset.value}
                onClick={() => setNextDueAt(nextDueAt === preset.value ? '' : preset.value)}
              >
                {preset.label} <span className={styles.presetHint}>{preset.hint}</span>
              </button>
            ))}
          </div>
          {nextDueAt && (
            <p className={styles.presetNote}>앱 알림이 켜져 있으면 이날 아침에 알려드려요.</p>
          )}
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
        max={localToday()}
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
