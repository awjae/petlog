'use client';

import type { CalendarEvent, CalendarView, PetColorMap } from '../types/calendar.types';
import { toDateString } from '../types/calendar.types';
import styles from './MonthlyCalendar.module.css';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TODAY = toDateString(new Date());
const MAX_DOTS = 3;

interface Props {
  gridDays: string[];
  currentMonth: number | null;
  currentYear: number | null;
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

export function MonthlyCalendar({
  gridDays,
  currentMonth,
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
      {/* 헤더만 sticky — 그리드는 콘텐츠와 함께 스크롤 */}
      <div className={styles.stickyHeader}>
        <div className={styles.header}>
          <button className={styles.navBtn} onClick={onPrev} aria-label="이전 달">
            ‹
          </button>
          <div className={styles.headerCenter}>
            <button className={styles.monthLabel} onClick={onGoToday} disabled={isCurrentPeriod}>
              {headerLabel}
              {!isCurrentPeriod && <span className={styles.todayDot} aria-hidden="true" />}
            </button>
            <div className={styles.viewToggle} role="group" aria-label="캘린더 뷰 선택">
              <button
                className={[styles.toggleBtn, viewMode === 'week' ? styles.toggleActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSwitchView('week')}
                aria-pressed={viewMode === 'week'}
              >
                주
              </button>
              <button
                className={[styles.toggleBtn, viewMode === 'month' ? styles.toggleActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSwitchView('month')}
                aria-pressed={viewMode === 'month'}
              >
                월
              </button>
            </div>
          </div>
          <button className={styles.navBtn} onClick={onNext} aria-label="다음 달">
            ›
          </button>
        </div>

        {/* 요일 레이블은 헤더와 함께 sticky */}
        <div className={styles.dayLabels} aria-hidden="true">
          {DAY_LABELS.map((label) => (
            <span key={label} className={styles.dayLabel}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* 날짜 그리드 — 스크롤 */}
      <div className={styles.grid} role="grid" aria-label="월간 캘린더">
        {gridDays.map((dateStr) => {
          const d = new Date(dateStr);
          const isCurrentMonth = currentMonth !== null && d.getMonth() === currentMonth;
          const isToday = dateStr === TODAY;
          const isSelected = dateStr === selectedDate;
          const events = eventsForDate(dateStr);
          const dots = events.slice(0, MAX_DOTS);
          const hasMore = events.length > MAX_DOTS;

          return (
            <button
              key={dateStr}
              className={[styles.cell, !isCurrentMonth ? styles.otherMonth : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(dateStr)}
              aria-pressed={isSelected}
              aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일${isToday ? ' 오늘' : ''}${events.length > 0 ? ` 이벤트 ${events.length}개` : ''}`}
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
                {d.getDate()}
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
