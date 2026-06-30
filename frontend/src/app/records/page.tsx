'use client';

import { useState } from 'react';
import { useCalendarData } from '@/features/calendar/hooks/useCalendarData';
import { WeeklyCalendar } from '@/features/calendar/components/WeeklyCalendar';
import { MonthlyCalendar } from '@/features/calendar/components/MonthlyCalendar';
import { EventList } from '@/features/calendar/components/EventList';
import { CalendarSkeleton } from '@/features/calendar/components/CalendarSkeleton';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { FAB } from '@/features/shared/components/FAB';
import { RecordTypeSelectSheet } from '@/features/shared/components/RecordTypeSelectSheet';
import { toDateString } from '@/features/calendar/types/calendar.types';
import styles from './page.module.css';

export default function RecordsPage() {
  const cal = useCalendarData();
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);

  if (cal.loading && !cal.pets.length) {
    return (
      <main className={styles.main} aria-label="기록">
        <header className={styles.header}>
          <h1 className={styles.title}>기록</h1>
        </header>
        <CalendarSkeleton />
        <BottomNav />
      </main>
    );
  }

  const shared = {
    gridDays: cal.gridDays,
    selectedDate,
    onSelectDate: setSelectedDate,
    eventsForDate: cal.eventsForDate,
    petColorMap: cal.petColorMap,
    headerLabel: cal.headerLabel,
    viewMode: cal.viewMode,
    onSwitchView: cal.switchView,
    onPrev: cal.prevPeriod,
    onNext: cal.nextPeriod,
    onGoToday: cal.goToday,
    isCurrentPeriod: cal.isCurrentPeriod,
  };

  return (
    <main className={styles.main} aria-label="기록">
      <header className={styles.header}>
        <h1 className={styles.title}>기록</h1>
      </header>

      {cal.viewMode === 'week' ? (
        <WeeklyCalendar {...shared} />
      ) : (
        <MonthlyCalendar
          {...shared}
          currentMonth={cal.currentMonth}
          currentYear={cal.currentYear}
        />
      )}

      <EventList
        selectedDate={selectedDate}
        events={cal.eventsForDate(selectedDate)}
        pets={cal.pets}
        petColorMap={cal.petColorMap}
      />

      <FAB onClick={() => setSheetOpen(true)} label="기록 추가" />
      <BottomNav />

      <RecordTypeSelectSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        pets={cal.pets}
      />
    </main>
  );
}
