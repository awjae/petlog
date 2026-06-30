'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { MedicationList } from '@/features/medication/components/MedicationList';
import { useMedications, useDeleteMedication } from '@/features/medication/hooks/useMedication';
import { FAB } from '@/features/shared/components/FAB';
import styles from './page.module.css';

export default function MedicationsPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter();
  const { petId } = use(params);
  const { data, loading, error } = useMedications(petId);
  const { deleteMedication } = useDeleteMedication();

  function renderContent() {
    if (loading && !data) {
      return (
        <div className={styles.loadingState} aria-label="로딩 중">
          <Loader2 size={32} className={styles.spinner} aria-hidden="true" />
        </div>
      );
    }
    if (error && !data) {
      return (
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>투약 기록을 불러올 수 없어요.</p>
        </div>
      );
    }
    return (
      <MedicationList items={data?.medications ?? []} onDelete={(id) => deleteMedication(id)} />
    );
  }

  return (
    <main className={styles.main} aria-label="투약 기록">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>투약 기록</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <div className={styles.content}>{renderContent()}</div>

      <FAB href={`/pets/${petId}/medications/new`} label="투약 추가" />
    </main>
  );
}
