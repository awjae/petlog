'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { MedicationForm } from '@/features/medication/components/MedicationForm';
import { useCreateMedication } from '@/features/medication/hooks/useMedication';
import type { CreateMedicationFormInput } from '@/features/medication/types/medication.types';
import styles from './page.module.css';

export default function NewMedicationPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter();
  const { petId } = use(params);
  const { createMedication, loading, error } = useCreateMedication();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(input: CreateMedicationFormInput) {
    const ok = await createMedication(input);
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
    <main className={styles.main} aria-label="투약 추가">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>투약 추가</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>
      <MedicationForm petId={petId} onSubmit={handleSubmit} loading={loading} error={error} />
    </main>
  );
}
