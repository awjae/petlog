import { calcDaysUntil } from '@/features/home/utils/homeDerive';
import styles from './DdayBadge.module.css';

interface DdayBadgeProps {
  dueDate: string;
  overdueLabel?: string;
}

export function DdayBadge({ dueDate, overdueLabel = '기한 초과' }: DdayBadgeProps) {
  const days = calcDaysUntil(dueDate);

  if (days < 0) {
    return (
      <span className={`${styles.badge} ${styles.overdue}`} aria-label={overdueLabel}>
        {overdueLabel}
      </span>
    );
  }

  const label = days === 0 ? 'D-Day' : `D-${days}`;
  const colorClass = days > 7 ? styles.far : days >= 3 ? styles.near : styles.urgent;

  return (
    <span className={`${styles.badge} ${colorClass}`} aria-label={`${days}일 후`}>
      {label}
    </span>
  );
}
