'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { VaccinationForm } from '@/features/medical/components/VaccinationForm';
import { useCreateVaccination } from '@/features/medical/hooks/useMedical';
import type { CreateVaccinationFormInput } from '@/features/medical/types/medical.types';
import styles from './page.module.css';

export default function NewVaccinationPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter();
  const { petId } = use(params);
  const { createVaccination, loading, error } = useCreateVaccination();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(input: CreateVaccinationFormInput) {
    const ok = await createVaccination(input);
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
    <main className={styles.main} aria-label="예방접종 기록 추가">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>예방접종</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>
      <VaccinationForm petId={petId} onSubmit={handleSubmit} loading={loading} error={error} />
    </main>
  );
}
