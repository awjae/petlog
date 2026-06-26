'use client';

import type { CalendarEvent, CalendarView, PetColorMap } from '../types/calendar.types';
import { toDateString } from '../types/calendar.types';
import styles from './WeeklyCalendar.module.css';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TODAY = toDateString(new Date());
const MAX_DOTS = 3;

interface Props {
  gridDays: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  eventsForDate: (date: string) => CalendarEvent[];
  petColorMap: PetColorMap;
  headerLabel: string;
  viewMode: CalendarView;
  onSwitchView: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToday: () => void;
  isCurrentPeriod: boolean;
}

export function WeeklyCalendar({
  gridDays,
  selectedDate,
  onSelectDate,
  eventsForDate,
  petColorMap,
  headerLabel,
  viewMode,
  onSwitchView,
  onPrev,
  onNext,
  onGoToday,
  isCurrentPeriod,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="이전 주">
          ‹
        </button>

        <div className={styles.headerCenter}>
          <button className={styles.monthLabel} onClick={onGoToday} disabled={isCurrentPeriod}>
            {headerLabel}
            {!isCurrentPeriod && <span className={styles.todayDot} aria-hidden="true" />}
          </button>
          <ViewToggle viewMode={viewMode} onSwitch={onSwitchView} />
        </div>

        <button className={styles.navBtn} onClick={onNext} aria-label="다음 주">
          ›
        </button>
      </div>

      <div className={styles.grid} role="grid" aria-label="주간 캘린더">
        {DAY_LABELS.map((label) => (
          <div key={label} className={styles.dayLabel} aria-hidden="true">
            {label}
          </div>
        ))}

        {gridDays.map((dateStr) => {
          const events = eventsForDate(dateStr);
          const isToday = dateStr === TODAY;
          const isSelected = dateStr === selectedDate;
          const dayNum = new Date(dateStr).getDate();
          const dots = events.slice(0, MAX_DOTS);
          const hasMore = events.length > MAX_DOTS;

          return (
            <button
              key={dateStr}
              className={styles.cell}
              onClick={() => onSelectDate(dateStr)}
              aria-pressed={isSelected}
              aria-label={`${dayNum}일${isToday ? ' 오늘' : ''}${events.length > 0 ? ` 이벤트 ${events.length}개` : ''}`}
            >
              <span
                className={[
                  styles.dayNum,
                  isToday && !isSelected ? styles.today : '',
                  isSelected ? styles.selected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {dayNum}
              </span>
              <span className={styles.dots} aria-hidden="true">
                {dots.map((e) => (
                  <span
                    key={e.id}
                    className={styles.dot}
                    style={{ background: petColorMap[e.petId] ?? 'var(--color-pet-1)' }}
                  />
                ))}
                {hasMore && <span className={`${styles.dot} ${styles.dotMore}`} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewToggle({
  viewMode,
  onSwitch,
}: {
  viewMode: CalendarView;
  onSwitch: (v: CalendarView) => void;
}) {
  return (
    <div className={styles.viewToggle} role="group" aria-label="캘린더 뷰 선택">
      <button
        className={[styles.toggleBtn, viewMode === 'week' ? styles.toggleActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSwitch('week')}
        aria-pressed={viewMode === 'week'}
      >
        주
      </button>
      <button
        className={[styles.toggleBtn, viewMode === 'month' ? styles.toggleActive : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSwitch('month')}
        aria-pressed={viewMode === 'month'}
      >
        월
      </button>
    </div>
  );
}
