'use client';

import { formatPeriodRange } from '../utils/reportFormat';
import styles from './ReportShareMasthead.module.css';

interface ReportShareMastheadProps {
  petName: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * ReportCover의 톤을 차용하되 mock 배지·정확한 시분 표기를 뺀 축소 버전.
 * SharePreviewFrame(공유 시트 미리보기)과 /share/reports/[shareToken](공개 페이지)이
 * 콘텐츠·순서 1:1 동일해야 하므로 두 곳에서 그대로 재사용한다.
 */
export function ReportShareMasthead({ petName, periodStart, periodEnd }: ReportShareMastheadProps) {
  return (
    <div className={styles.masthead}>
      <p className={styles.petName}>{petName || '반려동물 정보 없음'}</p>
      <p className={styles.period}>{formatPeriodRange(periodStart, periodEnd)}</p>
    </div>
  );
}
