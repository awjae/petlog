import styles from './HomeSkeleton.module.css';

export function HomeSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="로딩 중">
      {/* TodayRecordBanner 스켈레톤 */}
      <div className={styles.card}>
        <div className={`${styles.shimmer} ${styles.avatarSkeleton}`} />
        <div className={styles.divider} />
        <div className={styles.cardInfo}>
          <div className={`${styles.shimmer} ${styles.line} ${styles.lineMedium}`} />
          <div className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
        </div>
      </div>

      {/* QuickRecordButtons 스켈레톤 */}
      <div className={styles.banner}>
        <div className={`${styles.shimmer} ${styles.quickBtn}`} />
        <div className={`${styles.shimmer} ${styles.quickBtn}`} />
        <div className={`${styles.shimmer} ${styles.quickBtn}`} />
        <div className={`${styles.shimmer} ${styles.quickBtn}`} />
      </div>

      {/* UpcomingScheduleList 스켈레톤 */}
      <div>
        <div className={`${styles.shimmer} ${styles.sectionHeader}`} />
        <div className={`${styles.shimmer} ${styles.scheduleItem}`} />
        <div className={`${styles.shimmer} ${styles.scheduleItem}`} />
      </div>

      {/* RecentHealthRecordList 스켈레톤 */}
      <div>
        <div className={`${styles.shimmer} ${styles.sectionHeader}`} />
        <div className={`${styles.shimmer} ${styles.recordItem}`} />
        <div className={`${styles.shimmer} ${styles.recordItem}`} />
        <div className={`${styles.shimmer} ${styles.recordItem}`} />
      </div>
    </div>
  );
}
