'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useCreatePet } from '@/features/pet/hooks/useCreatePet';
import { PetForm, type PetFormValues } from '@/features/pet/components/PetForm';
import { useToast, ToastContainer } from '@/shared/components/Toast';
import styles from './page.module.css';

export default function NewPetPage() {
  const router = useRouter();
  const { createPet, loading } = useCreatePet();
  const { toasts, addToast, dismiss } = useToast();

  async function handleSubmit(values: PetFormValues) {
    const result = await createPet(values);
    if ('error' in result) {
      addToast(result.error, 'error');
      return;
    }
    // 등록 직후 첫 기록 화면까지 바로 잇는다 — 홈을 한 번 거치면 거기서 이탈한다
    // (2026-09 가입자가 반려동물만 등록하고 기록 0건으로 떠난 지점).
    // push가 아니라 replace여야 기록 저장 후 router.back()이 빈 등록 폼이 아닌 홈으로 간다.
    router.replace(`/records/new?petId=${result.petId}`);
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
        onSubmit={handleSubmit}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
