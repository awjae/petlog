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
  };

  return { data: homeData, loading, error, refetch };
}
