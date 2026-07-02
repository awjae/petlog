import styles from './ReportSkeleton.module.css';

export function ReportSkeleton() {
  return (
    <div className={styles.container} aria-label="로딩 중" aria-busy="true">
      <div className={`${styles.block} ${styles.blockCard}`} />
      <div className={`${styles.block} ${styles.blockButton}`} />
      <div className={styles.listGroup}>
        <div className={`${styles.block} ${styles.blockItem}`} />
        <div className={`${styles.block} ${styles.blockItem}`} />
      </div>
    </div>
  );
}

export function ReportDetailSkeleton() {
  return (
    <div className={styles.detailContainer} aria-label="로딩 중" aria-busy="true">
      <div className={styles.coverSkeleton}>
        <div className={styles.coverBadgeRow}>
          <div className={`${styles.block} ${styles.coverBadgeSm}`} />
          <div className={`${styles.block} ${styles.coverBadgeLg}`} />
        </div>
        <div className={`${styles.block} ${styles.coverPeriodBar}`} />
        <div className={`${styles.block} ${styles.coverMetaBar}`} />
      </div>

      <div className={styles.headlineSkeleton}>
        <div className={`${styles.block} ${styles.headlineEyebrowBar}`} />
        <div className={styles.headlineTextGroup}>
          <div className={`${styles.block} ${styles.headlineLineBar}`} />
          <div className={`${styles.block} ${styles.headlineLineBarShort}`} />
        </div>
      </div>

      <div className={`${styles.block} ${styles.blockSection}`} />
      <div className={`${styles.block} ${styles.blockSection}`} />
      <div className={`${styles.block} ${styles.blockSection}`} />
    </div>
  );
}
