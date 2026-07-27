import type { CalendarEvent, CalendarEventType, PetColorMap } from '../types/calendar.types';
import { EVENT_TYPE_CONFIG } from '../types/calendar.types';
import { RECORD_TYPE_ICONS, type RecordIconKey } from '@/shared/components/recordTypeIcons';
import { TYPE_LABEL, buildSummary } from '@/features/health-record/types/health-record.types';
import styles from './EventCard.module.css';

interface Props {
  event: CalendarEvent;
  petName: string;
  petColor: string;
  petColorMap: PetColorMap;
  showPetTag: boolean;
}

const EVENT_ICON: Record<CalendarEventType, RecordIconKey> = {
  health_record: 'healthRecord',
  vaccination: 'vaccination',
  medication: 'medication',
  appointment: 'appointment',
  medical_event: 'hospital',
};

/**
 * 건강 기록은 타임라인·홈과 같은 포매터(buildSummary)로 표기를 만든다.
 * 같은 5.2kg 기록이 화면마다 "5.2 kg" / "5.2"로 갈리던 문제를 막기 위한 것이다.
 */
function resolveSubtitle(event: CalendarEvent): string | null {
  if (event.type !== 'health_record' || event.recordType == null) return event.subtitle;
  return buildSummary(event.recordType, event.numValue, event.textValue) || null;
}

export function EventCard({ event, petName, petColor, showPetTag }: Props) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = RECORD_TYPE_ICONS[EVENT_ICON[event.type]];
  const subtitle = resolveSubtitle(event);
  // 건강 기록의 제목도 프론트 라벨을 쓴다. 백엔드가 따로 들고 있던 라벨과
  // 문구가 갈려('활동/대변/기분' vs '산책/배변/메모') 같은 기록이 화면마다
  // 다르게 보였다.
  const title =
    event.type === 'health_record' && event.recordType ? TYPE_LABEL[event.recordType] : event.title;

  return (
    <div className={styles.card} style={{ borderLeftColor: petColor }}>
      <span className={styles.icon} style={{ background: config.bgColor }} aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {showPetTag && (
        <span className={styles.petTag} style={{ background: petColor }}>
          {petName}
        </span>
      )}
    </div>
  );
}
