// filepath: src/features/home/components/RecentHealthRecordList.tsx

import Link from 'next/link';
import type { HealthRecordSummary } from '../types/home.types';
import styles from './RecentHealthRecordList.module.css';

type RecentHealthRecordListProps = {
  petId: string;
  records: HealthRecordSummary[];
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

const TYPE_LABEL: Record<string, string> = {
  weight: '체중',
  appetite: '식사',
  activity: '산책',
  mood: '메모',
  symptom: '증상',
  stool: '배변',
  vomit: '구토',
};

function getLabel(type: string): string {
  return TYPE_LABEL[type] ?? type;
}

export function RecentHealthRecordList({ petId, records }: RecentHealthRecordListProps) {
  return (
    <section className={styles.section} aria-label="최근 건강 기록">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>최근 건강 기록</h2>
        <Link href={`/pets/${petId}/timeline`} className={styles.viewAll}>
          전체 보기
        </Link>
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>아직 기록이 없어요</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {records.map((record) => (
            <li key={record.id} className={styles.item}>
              <div className={styles.topRow}>
                <span className={styles.type}>{getLabel(record.type)}</span>
                <span className={styles.date}>{formatDate(record.recordedAt)}</span>
              </div>
              <p className={styles.summary}>{record.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
