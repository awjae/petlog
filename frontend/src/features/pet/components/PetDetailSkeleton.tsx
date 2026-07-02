import styles from './PetDetailSkeleton.module.css';

export function PetDetailSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="로딩 중">
      <div className={styles.profile}>
        <div className={`${styles.shimmer} ${styles.avatar}`} />
        <div className={`${styles.shimmer} ${styles.nameLine}`} />
        <div className={`${styles.shimmer} ${styles.metaLine}`} />
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.shimmer} ${styles.statCard}`} />
        <div className={`${styles.shimmer} ${styles.statCard}`} />
      </div>

      <div className={styles.section}>
        <div className={`${styles.shimmer} ${styles.sectionHeader}`} />
        <div className={`${styles.shimmer} ${styles.listItem}`} />
        <div className={`${styles.shimmer} ${styles.listItem}`} />
        <div className={`${styles.shimmer} ${styles.listItem}`} />
      </div>

      <div className={styles.quickGrid}>
        <div className={`${styles.shimmer} ${styles.quickCard}`} />
        <div className={`${styles.shimmer} ${styles.quickCard}`} />
        <div className={`${styles.shimmer} ${styles.quickCard}`} />
        <div className={`${styles.shimmer} ${styles.quickCard}`} />
      </div>
    </div>
  );
}
