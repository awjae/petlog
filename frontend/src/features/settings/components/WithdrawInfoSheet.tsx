'use client';

import { BottomSheet } from '@/shared/components/BottomSheet';
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
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="회원 탈퇴 안내">
      {({ close, closeWith }) => (
        <>
          <header className={styles.sheetHeader}>
            <span className={styles.sheetTitle}>정말 탈퇴하시겠어요?</span>
            <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <div className={styles.body}>
            <ul className={styles.itemList}>
              {DELETED_ITEMS.map(({ Icon, label }) => (
                <li key={label} className={styles.item}>
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className={styles.itemIcon}
                    aria-hidden="true"
                  />
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
              <span className={styles.reassureText}>
                30일 이내 다시 로그인하면 복구할 수 있어요
              </span>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={close}>
                취소
              </button>
              <button
                type="button"
                className={styles.proceedBtn}
                onClick={() => closeWith(onProceed)}
              >
                탈퇴 진행
              </button>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
