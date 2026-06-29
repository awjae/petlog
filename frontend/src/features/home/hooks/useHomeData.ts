'use client';

import { useQuery } from '@apollo/client/react';
import { HOME_QUERY } from '../api/home.queries';
import type { HomeData, UpcomingSchedule } from '../types/home.types';

function calcDaysUntil(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// 브라우저 로컬 타임존 기준 YYYY-MM-DD 반환
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcStreak(utcIsoStrings: readonly string[]): number {
  if (utcIsoStrings.length === 0) return 0;

  const dateSet = new Set(utcIsoStrings.map((s) => toLocalDateString(new Date(s))));

  const now = Date.now();
  const todayStr = toLocalDateString(new Date(now));
  const yesterdayStr = toLocalDateString(new Date(now - 86_400_000));

  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) return 0;

  let cursorMs = dateSet.has(todayStr) ? now : now - 86_400_000;
  let streak = 0;

  while (dateSet.has(toLocalDateString(new Date(cursorMs)))) {
    streak++;
    cursorMs -= 86_400_000;
  }

  return streak;
}

type UseHomeDataReturn = {
  data: HomeData | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
};

export function useHomeData(): UseHomeDataReturn {
  const { data, loading, error, refetch } = useQuery(HOME_QUERY, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  if (!data?.me) {
    return { data: null, loading, error, refetch };
  }

  const upcomingSchedules: UpcomingSchedule[] = data.me.upcomingSchedules.map(
    (s): UpcomingSchedule => ({
      ...s,
      daysUntil: calcDaysUntil(s.dueDate),
    }),
  );

  const homeData: HomeData = {
    pets: data.me.pets,
    upcomingSchedules,
    streak: calcStreak(data.me.recordDates),
  };

  return { data: homeData, loading, error, refetch };
}
