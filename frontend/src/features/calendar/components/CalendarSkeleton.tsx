import styles from './CalendarSkeleton.module.css';

export function CalendarSkeleton() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div className={`${styles.bone} ${styles.navBtn}`} />
        <div className={`${styles.bone} ${styles.month}`} />
        <div className={`${styles.bone} ${styles.navBtn}`} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={styles.cell}>
            <div className={`${styles.bone} ${styles.dayNum}`} />
            <div className={`${styles.bone} ${styles.dots}`} />
          </div>
        ))}
      </div>
      <div className={styles.eventList}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${styles.bone} ${styles.eventCard}`} />
        ))}
      </div>
    </div>
  );
}
