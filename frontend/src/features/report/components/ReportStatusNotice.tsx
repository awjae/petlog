'use client';

import { Clock, AlertCircle } from 'lucide-react';
import styles from './ReportStatusNotice.module.css';

type ReportStatusNoticeVariant = 'processing' | 'failed';

interface ReportStatusNoticeProps {
  variant: ReportStatusNoticeVariant;
  onBack: () => void;
}

const NOTICE_CONTENT: Record<ReportStatusNoticeVariant, { heading: string; desc: string }> = {
  processing: {
    heading: '리포트를 만들고 있어요',
    desc: '완성되면 다시 확인해주세요',
  },
  failed: {
    heading: '리포트 생성에 실패했어요',
    desc: '이용에 불편을 드려 죄송해요. 잠시 후 다시 시도해주세요',
  },
};

export function ReportStatusNotice({ variant, onBack }: ReportStatusNoticeProps) {
  const { heading, desc } = NOTICE_CONTENT[variant];

  return (
    <div className={styles.notice}>
      {variant === 'processing' ? (
        <Clock size={64} strokeWidth={1.25} className={styles.icon} aria-hidden="true" />
      ) : (
        <AlertCircle
          size={64}
          strokeWidth={1.25}
          className={`${styles.icon} ${styles.iconDanger}`}
          aria-hidden="true"
        />
      )}
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.desc}>{desc}</p>
      <button type="button" className={styles.retryBtn} onClick={onBack}>
        돌아가기
      </button>
    </div>
  );
}
