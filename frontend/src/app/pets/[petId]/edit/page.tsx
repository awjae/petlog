'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { usePetEdit, usePetIds } from '@/features/pet/hooks/usePet';
import { useUpdatePet } from '@/features/pet/hooks/useUpdatePet';
import { DeletePetConfirmDialog } from '@/features/pet/components/DeletePetConfirmDialog';
import { PetForm, type PetFormValues } from '@/features/pet/components/PetForm';
import { useToast, ToastContainer } from '@/shared/components/Toast';
import styles from './page.module.css';

export default function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();

  const { pet, loading: fetchLoading, error: fetchError, notFound } = usePetEdit(petId);
  const { petCount } = usePetIds();
  const { updatePet, loading: saving } = useUpdatePet();
  const { toasts, addToast, dismiss } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 값이 도착하기 전에는 입력을 잠근다 — 폼과 삭제 링크가 같은 기준을 쓴다.
  const fieldsLocked = fetchLoading && !pet;

  async function handleSubmit(values: PetFormValues) {
    const failure = await updatePet(petId, {
      ...values,
      existingProfileImageUrl: pet?.profileImageUrl ?? null,
    });

    if (failure) addToast(failure, 'error');
    else router.push(`/pets/${petId}`);
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
        disabled={fieldsLocked}
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
          disabled={fieldsLocked}
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
