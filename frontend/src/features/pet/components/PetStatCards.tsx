import type { PetRecentWeight } from '../types/pet.types';
import { formatRelativeDate } from '../utils/petMeta';
import styles from './PetStatCards.module.css';

interface PetStatCardsProps {
  recentWeight: PetRecentWeight | null;
  todayRecordCount: number;
}

export function PetStatCards({ recentWeight, todayRecordCount }: PetStatCardsProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <p className={styles.label}>최근 체중</p>
        {recentWeight ? (
          <div className={styles.valueRow}>
            <span className={styles.value}>{recentWeight.value}kg</span>
            <span className={styles.sub}>{formatRelativeDate(recentWeight.recordedAt)}</span>
          </div>
        ) : (
          <p className={styles.empty}>체중 기록 없음</p>
        )}
      </div>

      <div className={styles.card}>
        <p className={styles.label}>오늘 기록</p>
        {todayRecordCount > 0 ? (
          <div className={styles.valueRow}>
            <span className={styles.value}>{todayRecordCount}건</span>
          </div>
        ) : (
          <p className={styles.empty}>아직 없어요</p>
        )}
      </div>
    </div>
  );
}
