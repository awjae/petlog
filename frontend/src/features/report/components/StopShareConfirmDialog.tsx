'use client';

import { Loader2 } from 'lucide-react';
import { useOverlayDismiss } from '@/shared/hooks/useOverlayDismiss';
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
  // 중단 처리 중에는 취소 버튼과 마찬가지로 뒤로 가기/Esc도 막는다.
  // isOpen을 false로 주면 "차단"이 아니라 "스택에서 제거"가 되어, 뒤로 가기가 한 단계
  // 아래(부모 ShareReportSheet)로 흘러가 요청 중에 부모 시트가 닫힌다. 항상 스택에
  // 올려두고 핸들러에서 막아야 한다.
  useOverlayDismiss(true, () => {
    if (!loading) onClose();
  });

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
