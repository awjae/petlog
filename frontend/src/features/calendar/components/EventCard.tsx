import type { CalendarEvent, PetColorMap } from '../types/calendar.types';
import { EVENT_TYPE_CONFIG } from '../types/calendar.types';
import styles from './EventCard.module.css';

interface Props {
  event: CalendarEvent;
  petName: string;
  petColor: string;
  petColorMap: PetColorMap;
  showPetTag: boolean;
}

export function EventCard({ event, petName, petColor, showPetTag }: Props) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <div className={styles.card} style={{ borderLeftColor: petColor }}>
      <span className={styles.icon} style={{ color: config.color }} aria-hidden="true">
        {config.icon}
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{event.title}</span>
        {event.subtitle && <span className={styles.subtitle}>{event.subtitle}</span>}
      </div>
      {showPetTag && (
        <span className={styles.petTag} style={{ background: petColor }}>
          {petName}
        </span>
      )}
    </div>
  );
}
