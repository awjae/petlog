'use client';

import { Sparkles, CheckCircle, LoaderCircle } from 'lucide-react';
import type { ReportStatusResult } from '../types/report.types';
import styles from './QuotaStatusCard.module.css';

interface QuotaStatusCardProps {
  status: ReportStatusResult;
}

function formatNextAvailable(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function QuotaStatusCard({ status }: QuotaStatusCardProps) {
  if (status.processingReport) {
    return (
      <div className={`${styles.card} ${styles.cardProcessing}`} aria-live="polite">
        <div className={styles.iconWrap}>
          <LoaderCircle size={22} strokeWidth={2} className={styles.spinIcon} aria-hidden="true" />
        </div>
        <div className={styles.textGroup}>
          <p className={styles.title}>리포트를 분석 중이에요</p>
          <p className={styles.desc}>AI가 건강 데이터를 분석하고 있어요. 잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (!status.canGenerateThisMonth) {
    return (
      <div className={`${styles.card} ${styles.cardExhausted}`}>
        <div className={`${styles.iconWrap} ${styles.iconSuccess}`}>
          <CheckCircle size={22} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className={styles.textGroup}>
          <p className={styles.title}>이번 달 리포트를 생성했어요</p>
          <p className={styles.desc}>
            {status.nextAvailableAt
              ? `다음 리포트는 ${formatNextAvailable(status.nextAvailableAt)}부터 가능해요`
              : '다음 달부터 다시 생성할 수 있어요'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.cardAvailable}`}>
      <div className={styles.iconWrap}>
        <Sparkles size={22} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className={styles.textGroup}>
        <p className={styles.title}>
          AI 건강 리포트 가능
          <span className={styles.badge}>1</span>
        </p>
        <p className={styles.desc}>
          {status.hasEnoughRecords
            ? `${status.recordCount}건 · ${status.recordDays}일 기록이 분석 준비됐어요`
            : `현재 ${status.recordCount}건 · ${status.recordDays}일 기록됨`}
        </p>
      </div>
    </div>
  );
}
