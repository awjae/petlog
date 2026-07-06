'use client';

import { useEffect, useState } from 'react';
import { X, PawPrint, Activity, Stethoscope, Pill, Sparkles, RotateCcw } from 'lucide-react';
import styles from './WithdrawInfoSheet.module.css';

interface WithdrawInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const DELETED_ITEMS = [
  { Icon: PawPrint, label: '반려동물 프로필' },
  { Icon: Activity, label: '건강 기록' },
  { Icon: Stethoscope, label: '병원 기록' },
  { Icon: Pill, label: '투약 기록' },
  { Icon: Sparkles, label: 'AI 리포트' },
];

export function WithdrawInfoSheet({ isOpen, onClose, onProceed }: WithdrawInfoSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const rAF1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(rAF1);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  function handleProceed() {
    setVisible(false);
    setTimeout(onProceed, 310);
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="회원 탈퇴 안내"
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        <header className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>정말 탈퇴하시겠어요?</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <ul className={styles.itemList}>
            {DELETED_ITEMS.map(({ Icon, label }) => (
              <li key={label} className={styles.item}>
                <Icon size={18} strokeWidth={1.75} className={styles.itemIcon} aria-hidden="true" />
                <span className={styles.itemLabel}>{label}</span>
              </li>
            ))}
          </ul>

          <div className={styles.reassureBox}>
            <RotateCcw
              size={18}
              strokeWidth={1.75}
              className={styles.reassureIcon}
              aria-hidden="true"
            />
            <span className={styles.reassureText}>30일 이내 다시 로그인하면 복구할 수 있어요</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose}>
              취소
            </button>
            <button type="button" className={styles.proceedBtn} onClick={handleProceed}>
              탈퇴 진행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
