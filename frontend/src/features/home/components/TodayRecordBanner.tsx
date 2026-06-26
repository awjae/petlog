'use client';

import { Flame, Check } from 'lucide-react';
import styles from './TodayRecordBanner.module.css';

type TodayRecordBannerProps = {
  count: number;
  petName: string;
  streak: number;
};

export function TodayRecordBanner({ count, petName, streak }: TodayRecordBannerProps) {
  return (
    <div className={styles.card} role="status">
      {streak > 0 && (
        <p className={styles.streak} aria-label={`${streak}일 연속 기록 중`}>
          <Flame size={14} strokeWidth={2} className={styles.streakIcon} aria-hidden="true" />
          <span className={styles.streakCount}>{streak}일</span> 연속 기록 중
        </p>
      )}

      {count === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>오늘 아직 기록이 없어요</p>
          <p className={styles.emptyDesc}>{petName}의 하루를 기록해보세요</p>
        </div>
      ) : (
        <div className={styles.done}>
          <span className={styles.doneIcon} aria-hidden="true">
            <Check size={16} strokeWidth={3} />
          </span>
          <p className={styles.doneText}>
            오늘 <strong>{count}건</strong> 기록했어요
            {count >= 3 ? ' 잘하고 있어요!' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
