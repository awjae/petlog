'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useDeletePet } from '../hooks/useDeletePet';
import { setPendingToast } from '@/features/shared/utils/pendingToast';
import styles from './DeletePetConfirmDialog.module.css';

interface DeletePetConfirmDialogProps {
  petId: string;
  petName: string;
  isLastPet: boolean;
  onClose: () => void;
}

export function DeletePetConfirmDialog({
  petId,
  petName,
  isLastPet,
  onClose,
}: DeletePetConfirmDialogProps) {
  const router = useRouter();
  const { deletePet, loading, error } = useDeletePet();

  async function handleConfirm() {
    const ok = await deletePet(petId);
    if (ok) {
      setPendingToast(`${petName}의 기록이 삭제되었어요`);
      router.push('/home');
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-pet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-pet-title" className={styles.title}>
          {petName}의 기록을 삭제할까요?
        </h2>
        <p className={styles.body}>
          삭제하면 {petName}의 건강 기록, 병원 기록, 투약 정보, 리포트가 더 이상 보이지 않아요. 이
          작업은 되돌릴 수 없어요.
        </p>
        {isLastPet && (
          <p className={styles.body}>마지막 반려동물이에요. 삭제하면 등록된 반려동물이 없어요.</p>
        )}

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
