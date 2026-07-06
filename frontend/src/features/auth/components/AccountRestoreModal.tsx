'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRestoreAccount } from '../hooks/useRestoreAccount';
import { useLogout } from '../hooks/useLogout';
import styles from './AccountRestoreModal.module.css';

interface AccountRestoreModalProps {
  remainingDays: number | null;
  onClose: () => void;
  onRestored: () => void;
}

export function AccountRestoreModal({
  remainingDays,
  onClose,
  onRestored,
}: AccountRestoreModalProps) {
  const { restore, loading: restoring, error } = useRestoreAccount();
  const { logout } = useLogout();
  const [cancelling, setCancelling] = useState(false);

  const busy = restoring || cancelling;

  async function handleCancel() {
    setCancelling(true);
    await logout();
    setCancelling(false);
    onClose();
  }

  async function handleRestore() {
    const result = await restore();
    if (result) onRestored();
  }

  const bodyText =
    remainingDays != null
      ? `남은 기간: ${remainingDays}일. 지금 복구하면 이전 기록을 그대로 이용할 수 있어요.`
      : '지금 복구하면 이전 기록을 그대로 이용할 수 있어요.';

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-restore-title"
      >
        <div className={styles.iconCircle} aria-hidden="true">
          <RotateCcw size={24} strokeWidth={1.75} />
        </div>

        <h2 id="account-restore-title" className={styles.title}>
          계정은 삭제 예정 상태예요
        </h2>
        <p className={styles.body}>{bodyText}</p>

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={busy}>
            취소
          </button>
          <button
            type="button"
            className={styles.restoreBtn}
            onClick={handleRestore}
            disabled={busy}
          >
            {restoring ? '복구하는 중...' : '복구하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
