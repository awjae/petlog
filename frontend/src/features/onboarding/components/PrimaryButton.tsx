'use client';

import styles from './PrimaryButton.module.css';

interface PrimaryButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// 1~3번째 슬라이드의 "다음"과 4번째 슬라이드의 "시작하기"를 겸용한다.
export function PrimaryButton({ label, onClick, loading, disabled }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? '확인 중...' : label}
    </button>
  );
}
