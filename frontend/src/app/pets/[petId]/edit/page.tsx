'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { usePetEdit, usePetIds } from '@/features/pet/hooks/usePet';
import { useUpdatePet } from '@/features/pet/hooks/useUpdatePet';
import { DeletePetConfirmDialog } from '@/features/pet/components/DeletePetConfirmDialog';
import { PetForm, type PetFormValues } from '@/features/pet/components/PetForm';
import { useToast, ToastContainer } from '@/features/shared/components/Toast';
import styles from './page.module.css';

export default function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();

  const { pet, loading: fetchLoading, error: fetchError, notFound } = usePetEdit(petId);
  const { petCount } = usePetIds();
  const { updatePet, loading: saving } = useUpdatePet();
  const { toasts, addToast, dismiss } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleSubmit(values: PetFormValues) {
    const ok = await updatePet(petId, {
      ...values,
      existingProfileImageUrl: pet?.profileImageUrl ?? null,
    });

    if (ok) {
      router.push(`/pets/${petId}`);
    } else {
      addToast('정보를 저장하지 못했어요. 다시 시도해주세요.', 'error');
    }
  }

  /* ── 반려동물을 찾을 수 없음 ── */
  if (notFound) {
    return (
      <main className={styles.centerMain} aria-label="반려동물을 찾을 수 없음">
        <p className={styles.notFoundText}>반려동물을 찾을 수 없어요</p>
        <button type="button" className={styles.homeBtn} onClick={() => router.push('/home')}>
          홈으로
        </button>
      </main>
    );
  }

  /* ── 네트워크 오류(최초 로딩 실패) ── */
  if (fetchError && !pet) {
    return (
      <main className={styles.centerMain} aria-label="정보 수정">
        <p className={styles.notFoundText}>정보를 불러오지 못했어요</p>
        <button type="button" className={styles.homeBtn} onClick={() => router.back()}>
          돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className={styles.main} aria-label="반려동물 정보 수정">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>정보 수정</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <PetForm
        initialValues={pet}
        disabled={fetchLoading && !pet}
        avatarHint="사진 변경"
        submitLabel="저장"
        submittingLabel="저장 중..."
        submitting={saving}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className={styles.deleteLink}
          onClick={() => setShowDeleteDialog(true)}
          disabled={fetchLoading && !pet}
        >
          반려동물 삭제
        </button>
      </PetForm>

      {showDeleteDialog && pet && (
        <DeletePetConfirmDialog
          petId={petId}
          petName={pet.name}
          isLastPet={petCount === 1}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
