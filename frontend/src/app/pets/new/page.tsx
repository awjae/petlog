'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useCreatePet } from '@/features/pet/hooks/useCreatePet';
import { PetForm, type PetFormValues } from '@/features/pet/components/PetForm';
import styles from './page.module.css';

export default function NewPetPage() {
  const router = useRouter();
  const { createPet, loading, error } = useCreatePet();

  async function handleSubmit(values: PetFormValues) {
    const ok = await createPet(values);
    if (ok) router.push('/home');
  }

  return (
    <main className={styles.main} aria-label="반려동물 등록">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>반려동물 등록</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <PetForm
        avatarHint="사진 추가 (선택)"
        submitLabel="등록하기"
        submittingLabel="등록 중..."
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
