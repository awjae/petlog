// filepath: src/features/home/components/HomeSkeleton.tsx

import styles from './HomeSkeleton.module.css';

export function HomeSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="로딩 중">
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div className={`${styles.shimmer} ${styles.avatarSkeleton}`} />
          <div className={styles.cardInfo}>
            <div className={`${styles.shimmer} ${styles.line} ${styles.lineMedium}`} />
            <div className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
          </div>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
      </div>

      <div className={`${styles.shimmer} ${styles.banner}`} />

      <div>
        <div className={`${styles.shimmer} ${styles.sectionHeader}`} />
        <div className={`${styles.shimmer} ${styles.scheduleItem}`} />
        <div className={`${styles.shimmer} ${styles.scheduleItem}`} />
      </div>

      <div>
        <div className={`${styles.shimmer} ${styles.sectionHeader}`} />
        <div className={`${styles.shimmer} ${styles.recordItem} ${styles.recordItem}`} />
        <div className={`${styles.shimmer} ${styles.recordItem}`} />
        <div className={`${styles.shimmer} ${styles.recordItem}`} />
      </div>
    </div>
  );
}
