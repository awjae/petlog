'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Report } from '../types/report.types';
import styles from './ReportListItem.module.css';

interface ReportListItemProps {
  report: Report;
}

function formatPeriodLabel(periodStart: string): string {
  const d = new Date(periodStart);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 리포트`;
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function ReportListItem({ report }: ReportListItemProps) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className={styles.card}
      aria-label={formatPeriodLabel(report.periodStart)}
    >
      <div className={styles.header}>
        <span className={styles.periodLabel}>{formatPeriodLabel(report.periodStart)}</span>
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
