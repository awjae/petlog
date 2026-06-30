import type { CalendarEvent, CalendarEventType, PetColorMap } from '../types/calendar.types';
import { EVENT_TYPE_CONFIG } from '../types/calendar.types';
import {
  RECORD_ILLUSTRATIONS,
  type IllustrationKey,
} from '@/shared/components/RecordTypeIllustrations';
import styles from './EventCard.module.css';

interface Props {
  event: CalendarEvent;
  petName: string;
  petColor: string;
  petColorMap: PetColorMap;
  showPetTag: boolean;
}

const EVENT_ILLUSTRATION: Record<CalendarEventType, IllustrationKey> = {
  health_record: 'healthRecord',
  vaccination: 'vaccination',
  medication: 'medication',
  appointment: 'appointment',
  medical_event: 'hospital',
};

export function EventCard({ event, petName, petColor, showPetTag }: Props) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Illust = RECORD_ILLUSTRATIONS[EVENT_ILLUSTRATION[event.type]];

  return (
    <div className={styles.card} style={{ borderLeftColor: petColor }}>
      <span className={styles.icon} style={{ background: config.bgColor }} aria-hidden="true">
        <Illust size={26} />
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
