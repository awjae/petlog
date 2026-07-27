import Link from 'next/link';
import type { PetRecentHealthRecord } from '../types/pet.types';
import { formatShortDate } from '../utils/petMeta';
import { TYPE_LABEL, buildSummary } from '@/features/health-record/types/health-record.types';
import styles from './PetRecentRecords.module.css';

interface PetRecentRecordsProps {
  petId: string;
  records: PetRecentHealthRecord[];
}

export function PetRecentRecords({ petId, records }: PetRecentRecordsProps) {
  return (
    <section className={styles.section} aria-label="최근 건강 기록">
      <div className={styles.header}>
        <h3 className={styles.title}>최근 건강 기록</h3>
        <Link href={`/pets/${petId}/timeline`} className={styles.viewAll}>
          전체 보기
        </Link>
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>아직 기록이 없어요. 첫 건강 기록을 남겨보세요</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {records.map((record) => (
            <li key={record.id} className={styles.item}>
              <div className={styles.topRow}>
                <span className={styles.type}>{TYPE_LABEL[record.type]}</span>
                <span className={styles.date}>{formatShortDate(record.recordedAt)}</span>
              </div>
              <p className={styles.summary}>
                {buildSummary(record.type, record.numValue ?? null, record.textValue ?? null)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
