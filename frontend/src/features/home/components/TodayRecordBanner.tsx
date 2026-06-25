// filepath: src/features/home/components/TodayRecordBanner.tsx

import styles from './TodayRecordBanner.module.css';

type TodayRecordBannerProps = {
  count: number;
};

export function TodayRecordBanner({ count }: TodayRecordBannerProps) {
  if (count === 0) {
    return (
      <div className={`${styles.banner} ${styles.empty}`} role="status">
        <p className={styles.text}>오늘 첫 기록을 남겨보세요</p>
      </div>
    );
  }

  const suffix = count >= 5 ? ' 잘하고 있어요! 🐾' : '';

  return (
    <div className={`${styles.banner} ${styles.hasRecords}`} role="status">
      <p className={`${styles.text} ${styles.textPrimary}`}>
        오늘 {count}건 기록했어요{suffix}
      </p>
    </div>
  );
}
