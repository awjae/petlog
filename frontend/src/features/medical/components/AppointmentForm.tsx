'use client';

import { useState } from 'react';
import { CalendarDays, Loader2, Check } from 'lucide-react';
import { DatePickerSheet, formatDateKo } from '@/shared/components/DatePickerSheet';
import type { CreateAppointmentFormInput } from '../types/medical.types';
import styles from './AppointmentForm.module.css';

interface AppointmentFormProps {
  petId: string;
  onSubmit: (input: CreateAppointmentFormInput) => void;
  loading: boolean;
  error: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function AppointmentForm({ petId, onSubmit, loading, error }: AppointmentFormProps) {
  const [hospitalName, setHospitalName] = useState('');
  const [scheduledAt, setScheduledAt] = useState(tomorrow);
  const [reason, setReason] = useState('');
  const [memo, setMemo] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const isValid = hospitalName.trim().length > 0 && scheduledAt.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit({
      petId,
      hospitalName: hospitalName.trim(),
      scheduledAt,
      reason: reason.trim() || undefined,
      memo: memo.trim() || undefined,
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>예약 날짜</h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePickerOpen(true)}
            aria-label="예약 날짜 선택"
          >
            <span className={scheduledAt ? undefined : styles.dateTriggerPlaceholder}>
              {scheduledAt ? formatDateKo(scheduledAt) : '날짜 선택'}
            </span>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>병원 이름</h2>
          <input
            type="text"
            className={styles.textInput}
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="예: 행복 동물병원"
            maxLength={100}
            aria-label="병원 이름"
            required
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>
            방문 이유 <span className={styles.optional}>(선택)</span>
          </h2>
          <input
            type="text"
            className={styles.textInput}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 정기 건강검진, 예방접종"
            maxLength={100}
            aria-label="방문 이유 (선택)"
          />
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

      <DatePickerSheet
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={scheduledAt}
        onChange={setScheduledAt}
        min={today()}
        title="예약 날짜 선택"
      />
    </>
  );
}
