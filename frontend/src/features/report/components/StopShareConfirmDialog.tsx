'use client';

import { Loader2 } from 'lucide-react';
import styles from './StopShareConfirmDialog.module.css';

interface StopShareConfirmDialogProps {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function StopShareConfirmDialog({
  loading,
  onConfirm,
  onClose,
}: StopShareConfirmDialogProps) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stop-share-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stop-share-title" className={styles.title}>
          공유를 중지할까요?
        </h2>
        <p className={styles.body}>
          중지하면 링크로 더 이상 리포트를 볼 수 없어요. 링크는 다시 공유하면 그대로 재사용할 수
          있어요.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                중지 중...
              </>
            ) : (
              '공유 중지'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
