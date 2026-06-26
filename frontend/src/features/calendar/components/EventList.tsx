import type { CalendarEvent, CalendarPet, PetColorMap } from '../types/calendar.types';
import { EventCard } from './EventCard';
import styles from './EventList.module.css';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  selectedDate: string;
  events: CalendarEvent[];
  pets: CalendarPet[];
  petColorMap: PetColorMap;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayLabel = DAY_LABELS[d.getDay()];
  return `${month}월 ${day}일 ${dayLabel}요일`;
}

export function EventList({ selectedDate, events, pets, petColorMap }: Props) {
  const showPetTag = pets.length > 1;

  const petById = Object.fromEntries(pets.map((p) => [p.id, p]));

  return (
    <div className={styles.container}>
      <span className={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>

      {events.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>기록이 없어요</p>
          <p className={styles.emptyHint}>아래 + 버튼으로 기록을 추가해보세요</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {events.map((event) => {
            const pet = petById[event.petId];
            return (
              <li key={event.id}>
                <EventCard
                  event={event}
                  petName={pet?.name ?? ''}
                  petColor={petColorMap[event.petId] ?? 'var(--color-pet-1)'}
                  petColorMap={petColorMap}
                  showPetTag={showPetTag}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
