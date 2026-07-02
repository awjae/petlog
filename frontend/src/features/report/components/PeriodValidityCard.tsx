'use client';

import Link from 'next/link';
import { AlertCircle, AlertTriangle, CheckCircle, Inbox } from 'lucide-react';
import { MIN_RECORD_COUNT, MIN_RECORD_DAYS } from '../utils/reportPeriod';
import styles from './PeriodValidityCard.module.css';

export type PeriodValidityState = 'loading' | 'valid' | 'insufficient' | 'empty' | 'error';

interface PeriodValidityCardProps {
  state: PeriodValidityState;
  recordCount?: number;
  recordDays?: number;
  onRetry?: () => void;
}

export function PeriodValidityCard({
  state,
  recordCount = 0,
  recordDays = 0,
  onRetry,
}: PeriodValidityCardProps) {
  return (
    <div key={state} className={`${styles.card} ${styles[`card_${state}`]}`} aria-live="polite">
      {state === 'loading' && (
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonBar} />
        </div>
      )}

      {state === 'valid' && (
        <>
          <CheckCircle size={20} strokeWidth={2} className={styles.icon} aria-hidden="true" />
          <p className={styles.text}>
            {recordCount}건 · {recordDays}일 기록 확인됨
          </p>
        </>
      )}

      {state === 'insufficient' && (
        <div className={styles.insufficientBody}>
          <div className={styles.insufficientRow}>
            <AlertTriangle size={20} strokeWidth={2} className={styles.icon} aria-hidden="true" />
            <p className={styles.text}>
              현재 {recordCount}건 · {recordDays}일 기록됨 ({MIN_RECORD_COUNT}건 · {MIN_RECORD_DAYS}
              일 필요)
            </p>
          </div>
          <Link href="/records/new" className={styles.recordLink}>
            지금 기록하러 가기
          </Link>
        </div>
      )}

      {state === 'empty' && (
        <>
          <Inbox size={20} strokeWidth={2} className={styles.icon} aria-hidden="true" />
          <p className={styles.text}>이 기간에는 기록이 없어요</p>
        </>
      )}

      {state === 'error' && (
        <div className={styles.errorBody}>
          <div className={styles.errorRow}>
            <AlertCircle size={20} strokeWidth={2} className={styles.icon} aria-hidden="true" />
            <p className={styles.text}>기록을 확인하지 못했어요</p>
          </div>
          {onRetry && (
            <button type="button" className={styles.retryBtn} onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}
