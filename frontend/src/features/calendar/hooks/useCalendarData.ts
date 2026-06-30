'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { CombinedGraphQLErrors } from '@apollo/client';
import { CALENDAR_QUERY } from '../api/calendar.queries';
import {
  buildPetColorMap,
  buildWeekHeaderLabel,
  getMonthGridDays,
  getMonthRange,
  getWeekDays,
  getWeekRange,
  isSameDay,
  toDateString,
  toLocalDayEnd,
  toLocalDayStart,
  type CalendarEvent,
  type CalendarView,
  type PetColorMap,
} from '../types/calendar.types';

function isUnauthenticatedError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      (e.extensions?.originalError as { statusCode?: number } | undefined)?.statusCode === 401,
  );
}

export function useCalendarData() {
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  // anchorDate 하나로 현재 기간을 관리. 뷰 전환 시 anchorDate를 건드리지 않아
  // 자연스럽게 동일한 기간이 유지된다.
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const today = new Date();

  const gridDays =
    viewMode === 'week'
      ? getWeekDays(getWeekRange(anchorDate).startDate)
      : getMonthGridDays(anchorDate);

  const { startDate, endDate } =
    viewMode === 'week' ? getWeekRange(anchorDate) : getMonthRange(gridDays);

  const headerLabel =
    viewMode === 'week'
      ? buildWeekHeaderLabel(startDate, endDate)
      : `${anchorDate.getFullYear()}년 ${anchorDate.getMonth() + 1}월`;

  const { data, loading, error, refetch } = useQuery(CALENDAR_QUERY, {
    variables: { startDate: toLocalDayStart(startDate), endDate: toLocalDayEnd(endDate) },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const pets = data?.me?.pets ?? [];
  const events = data?.me?.calendarEvents ?? [];
  const petColorMap: PetColorMap = buildPetColorMap(pets);

  function eventsForDate(dateStr: string): CalendarEvent[] {
    return events.filter((e) => isSameDay(e.date, dateStr));
  }

  function switchView(mode: CalendarView) {
    // anchorDate 유지 — 같은 날짜를 기준으로 주/월 뷰만 전환
    setViewMode(mode);
  }

  function prevPeriod() {
    setAnchorDate((d) => {
      if (viewMode === 'week') {
        const next = new Date(d);
        next.setDate(d.getDate() - 7);
        return next;
      }
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  }

  function nextPeriod() {
    setAnchorDate((d) => {
      if (viewMode === 'week') {
        const next = new Date(d);
        next.setDate(d.getDate() + 7);
        return next;
      }
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  const isCurrentPeriod =
    viewMode === 'week'
      ? getWeekRange(anchorDate).startDate === getWeekRange(today).startDate
      : anchorDate.getFullYear() === today.getFullYear() &&
        anchorDate.getMonth() === today.getMonth();

  return {
    loading,
    isUnauthenticated: isUnauthenticatedError(error),
    error: !isUnauthenticatedError(error) ? error : undefined,
    pets,
    petColorMap,
    eventsForDate,
    gridDays,
    viewMode,
    switchView,
    headerLabel,
    currentMonth: viewMode === 'month' ? anchorDate.getMonth() : null,
    currentYear: viewMode === 'month' ? anchorDate.getFullYear() : null,
    isCurrentPeriod,
    prevPeriod,
    nextPeriod,
    goToday,
    refetch,
    todayStr: toDateString(today),
  };
}
