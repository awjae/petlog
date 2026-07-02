'use client';

import styles from './ReportHeadline.module.css';

interface ReportHeadlineProps {
  overview: string | null;
  hasOtherContent: boolean;
}

export function ReportHeadline({ overview, hasOtherContent }: ReportHeadlineProps) {
  const text = overview
    ? overview
    : hasOtherContent
      ? '이번 리포트의 상세 내용을 아래에서 확인해보세요'
      : '이번 기간에는 특별히 기록된 변화가 없어요';

  return (
    <div className={styles.headline}>
      <p className={styles.eyebrow}>이번 기간 한눈에 보기</p>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
