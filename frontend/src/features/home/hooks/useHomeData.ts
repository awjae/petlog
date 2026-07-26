'use client';

import { useQuery } from '@apollo/client/react';
import { HOME_QUERY } from '../api/home.queries';
import type { HomeData, UpcomingSchedule } from '../types/home.types';
import { calcDaysUntil, calcStreak } from '../utils/homeDerive';

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
