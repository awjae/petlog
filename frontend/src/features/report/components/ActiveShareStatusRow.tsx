'use client';

import { CheckCircle2 } from 'lucide-react';
import styles from './ActiveShareStatusRow.module.css';

interface ActiveShareStatusRowProps {
  onStopClick: () => void;
  disabled?: boolean;
}

export function ActiveShareStatusRow({ onStopClick, disabled = false }: ActiveShareStatusRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.textGroup}>
        <CheckCircle2 size={16} strokeWidth={2} className={styles.icon} aria-hidden="true" />
        <span className={styles.text}>공유 중이에요</span>
      </div>
      <button type="button" className={styles.stopBtn} onClick={onStopClick} disabled={disabled}>
        공유 중지
      </button>
    </div>
  );
}
