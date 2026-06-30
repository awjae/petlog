'use client';

import { useState } from 'react';
import { CalendarDays, Loader2, Check } from 'lucide-react';
import { DatePickerSheet, formatDateKo } from '@/shared/components/DatePickerSheet';
import type { CreateMedicalEventFormInput } from '../types/medical.types';
import styles from './MedicalVisitForm.module.css';

interface MedicalVisitFormProps {
  petId: string;
  onSubmit: (input: CreateMedicalEventFormInput) => void;
  loading: boolean;
  error: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function MedicalVisitForm({ petId, onSubmit, loading, error }: MedicalVisitFormProps) {
  const [hospitalName, setHospitalName] = useState('');
  const [visitDate, setVisitDate] = useState(today);
  const [description, setDescription] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const isValid = hospitalName.trim().length > 0 && visitDate.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit({ petId, hospitalName: hospitalName.trim(), visitDate, description });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>날짜</h2>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={() => setDatePickerOpen(true)}
            aria-label="방문 날짜 선택"
          >
            <span className={visitDate ? undefined : styles.dateTriggerPlaceholder}>
              {visitDate ? formatDateKo(visitDate) : '날짜 선택'}
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
            기록 내용 <span className={styles.optional}>(선택)</span>
          </h2>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이번 방문에서 있었던 일을 자유롭게 적어보세요"
            rows={4}
            maxLength={500}
            aria-label="기록 내용 (선택)"
          />
          <p className={styles.charCount}>{description.length} / 500</p>
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
        value={visitDate}
        onChange={setVisitDate}
        max={today()}
        title="방문 날짜 선택"
      />
    </>
  );
}
