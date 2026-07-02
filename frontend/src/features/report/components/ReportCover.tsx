'use client';

import { FlaskConical } from 'lucide-react';
import type { GeneratedBy } from '../types/report.types';
import { formatPeriodRange, formatCreatedAt } from '../utils/reportFormat';
import styles from './ReportCover.module.css';

interface ReportCoverProps {
  generatedBy: GeneratedBy;
  periodStart: string;
  periodEnd: string;
  petName: string;
  createdAt: string;
}

export function ReportCover({
  generatedBy,
  periodStart,
  periodEnd,
  petName,
  createdAt,
}: ReportCoverProps) {
  const petLabel = petName || '반려동물 정보 없음';

  return (
    <div className={styles.cover}>
      {generatedBy === 'mock' && (
        <div className={styles.badgeRow}>
          <span className={styles.mockBadge}>
            <FlaskConical size={12} strokeWidth={2} aria-hidden="true" />
            테스트 리포트
          </span>
        </div>
      )}
      <p className={styles.period}>{formatPeriodRange(periodStart, periodEnd)}</p>
      <p className={styles.meta}>
        {petLabel} · {formatCreatedAt(createdAt)}
      </p>
    </div>
  );
}
