'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { AppointmentForm } from '@/features/medical/components/AppointmentForm';
import { useCreateAppointment } from '@/features/medical/hooks/useMedical';
import type { CreateAppointmentFormInput } from '@/features/medical/types/medical.types';
import styles from './page.module.css';

export default function NewAppointmentPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter();
  const { petId } = use(params);
  const { createAppointment, loading, error } = useCreateAppointment();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(input: CreateAppointmentFormInput) {
    const ok = await createAppointment(input);
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.back(), 800);
    }
  }

  if (success) {
    return (
      <div className={styles.successOverlay} role="status">
        <span className={styles.successIcon} aria-hidden="true">
          <Check size={36} strokeWidth={3} />
        </span>
        <p className={styles.successText}>기록했어요!</p>
      </div>
    );
  }

  return (
    <main className={styles.main} aria-label="병원 예약 추가">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>병원 예약</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>
      <AppointmentForm petId={petId} onSubmit={handleSubmit} loading={loading} error={error} />
    </main>
  );
}
