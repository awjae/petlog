'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Report } from '../types/report.types';
import { formatPeriodRange, formatCreatedAt } from '../utils/reportFormat';
import styles from './ReportListItem.module.css';

interface ReportListItemProps {
  report: Report;
}

export function ReportListItem({ report }: ReportListItemProps) {
  const periodLabel = formatPeriodRange(report.periodStart, report.periodEnd);

  return (
    <Link href={`/reports/${report.id}`} className={styles.card} aria-label={periodLabel}>
      <div className={styles.header}>
        <span className={styles.periodLabel}>{periodLabel}</span>
        <span className={styles.date}>{formatCreatedAt(report.createdAt)}</span>
      </div>

      {report.overview && <p className={styles.overview}>{report.overview}</p>}

      <div className={styles.footer}>
        <span className={styles.viewLink}>
          보기
          <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
