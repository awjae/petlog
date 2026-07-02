'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
  addDays,
  maxDateStr,
  minDateStr,
  todayDateOnly,
} from '../utils/reportPeriod';
import styles from './PeriodCalendar.module.css';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function monthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function getMonthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${pad(m)}-${pad(d)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface PeriodCalendarProps {
  /** 현재 이 캘린더에서 편집 중인 날짜(시작일 또는 종료일) */
  selectedDate: string | null;
  /** 종료일 캘린더일 때 이미 확정된 시작일. 최소/최대 간격 제약과 하이라이트에 쓰인다. */
  referenceDate?: string | null;
  /** 선택 가능한 전체 하한(반려동물 등록일) */
  minDate: string;
  /** 선택 가능한 전체 상한(오늘) */
  maxDate: string;
  onSelect: (date: string) => void;
}

export function PeriodCalendar({
  selectedDate,
  referenceDate,
  minDate,
  maxDate,
  onSelect,
}: PeriodCalendarProps) {
  const [viewMonth, setViewMonth] = useState(monthOf(selectedDate ?? maxDate));

  const today = todayDateOnly();

  // referenceDate가 있으면(종료일 선택 중) 7~90일 간격 제약을 minDate/maxDate와 함께 좁힌다.
  const effectiveMin = referenceDate
    ? maxDateStr(minDate, addDays(referenceDate, MIN_PERIOD_DAYS - 1))
    : minDate;
  const effectiveMax = referenceDate
    ? minDateStr(maxDate, addDays(referenceDate, MAX_PERIOD_DAYS - 1))
    : maxDate;

  const minMonth = monthOf(minDate);
  const maxMonth = monthOf(maxDate);
  const prevDisabled = viewMonth <= minMonth;
  const nextDisabled = viewMonth >= maxMonth;

  const [y, m] = viewMonth.split('-').map(Number);
  const cells = getMonthGrid(viewMonth);

  return (
    <div className={styles.root}>
      <div className={styles.navHeader}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setViewMonth((v) => shiftMonth(v, -1))}
          disabled={prevDisabled}
          aria-label="이전 달"
        >
          <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <span className={styles.navLabel}>
          {y}년 {m}월
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setViewMonth((v) => shiftMonth(v, 1))}
          disabled={nextDisabled}
          aria-label="다음 달"
        >
          <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid} role="grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className={styles.cell} aria-hidden="true" />;

          const isDisabled = date < effectiveMin || date > effectiveMax;
          const isSelected = date === selectedDate;
          const isReference = !!referenceDate && date === referenceDate && !isSelected;
          const isToday = date === today;
          const day = Number(date.slice(8, 10));

          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              className={styles.cell}
              disabled={isDisabled}
              aria-selected={isSelected}
              aria-label={date}
              onClick={() => onSelect(date)}
            >
              <span
                className={`${styles.cellInner} ${isDisabled ? styles.cellDisabled : ''} ${
                  isSelected ? styles.cellSelected : ''
                } ${isReference ? styles.cellReference : ''} ${
                  isToday && !isSelected ? styles.cellToday : ''
                }`}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
