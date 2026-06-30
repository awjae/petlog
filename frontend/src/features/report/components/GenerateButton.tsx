'use client';

import { LoaderCircle, Sparkles } from 'lucide-react';
import styles from './GenerateButton.module.css';

interface GenerateButtonProps {
  canGenerate: boolean;
  hasEnoughRecords: boolean;
  loading: boolean;
  onClick: () => void;
}

export function GenerateButton({
  canGenerate,
  hasEnoughRecords,
  loading,
  onClick,
}: GenerateButtonProps) {
  const isDisabled = !canGenerate || !hasEnoughRecords || loading;

  if (loading) {
    return (
      <button type="button" className={`${styles.btn} ${styles.btnLoading}`} disabled>
        <LoaderCircle size={18} strokeWidth={2} className={styles.spinner} aria-hidden="true" />
        리포트 생성 중...
      </button>
    );
  }

  if (!canGenerate) {
    return (
      <button
        type="button"
        className={`${styles.btn} ${styles.btnDisabled}`}
        disabled
        aria-label="이번 달 리포트를 이미 생성했어요"
      >
        이번 달 리포트 생성 완료
      </button>
    );
  }

  if (!hasEnoughRecords) {
    return (
      <button
        type="button"
        className={`${styles.btn} ${styles.btnDisabled}`}
        disabled
        aria-label="기록이 더 필요해요"
      >
        기록 10건 이상, 7일 이상 기간이 필요해요
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${styles.btnActive}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
      AI 리포트 생성하기
    </button>
  );
}
