// filepath: src/features/home/components/UpcomingScheduleList.tsx

import Link from 'next/link';
import Image from 'next/image';
import type { UpcomingSchedule } from '../types/home.types';
import styles from './UpcomingScheduleList.module.css';

type UpcomingScheduleListProps = {
  schedules: UpcomingSchedule[];
};

const TYPE_ICON: Record<UpcomingSchedule['type'], string> = {
  vaccination: '💉',
  medication: '💊',
  appointment: '🏥',
};

function getScheduleHref(schedule: UpcomingSchedule): string {
  if (schedule.type === 'medication') {
    return `/pets/${schedule.petId}/medications`;
  }
  return `/pets/${schedule.petId}/medical`;
}

function formatDDay(daysUntil: number): string {
  if (daysUntil === 0) return 'D-0';
  if (daysUntil < 0) return `D+${Math.abs(daysUntil)}`;
  return `D-${daysUntil}`;
}

export function UpcomingScheduleList({ schedules }: UpcomingScheduleListProps) {
  if (schedules.length === 0) return null;

  return (
    <section className={styles.section} aria-label="다가오는 일정">
      <h2 className={styles.sectionTitle}>다가오는 일정</h2>
      <ul className={styles.list}>
        {schedules.map((schedule) => {
          const isUrgent = schedule.daysUntil <= 1;
          return (
            <li key={schedule.id} className={styles.item}>
              <Link
                href={getScheduleHref(schedule)}
                className={styles.link}
                aria-label={`${schedule.title}, ${schedule.petName}, ${formatDDay(schedule.daysUntil)}`}
              >
                <span className={styles.typeIcon} aria-hidden="true">
                  {TYPE_ICON[schedule.type]}
                </span>
                <div className={styles.content}>
                  <p className={styles.title}>{schedule.title}</p>
                  <div className={styles.petRow}>
                    {schedule.petProfileImageUrl ? (
                      <Image
                        src={schedule.petProfileImageUrl}
                        alt={schedule.petName}
                        width={20}
                        height={20}
                        className={styles.petAvatar}
                      />
                    ) : (
                      <span className={styles.petAvatarPlaceholder} aria-hidden="true">
                        🐾
                      </span>
                    )}
                    <span className={styles.petName}>{schedule.petName}</span>
                  </div>
                </div>
                <span
                  className={`${styles.badge} ${isUrgent ? styles.badgeUrgent : styles.badgeNormal}`}
                  aria-label={`${formatDDay(schedule.daysUntil)} 남음`}
                >
                  {formatDDay(schedule.daysUntil)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
