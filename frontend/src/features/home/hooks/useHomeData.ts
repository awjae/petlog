'use client';

import { useQuery } from '@apollo/client/react';
import { CombinedGraphQLErrors } from '@apollo/client';
import { HOME_QUERY } from '../api/home.queries';
import type { HomeData, HomeQueryResult, UpcomingSchedule } from '../types/home.types';

function calcDaysUntil(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isUnauthenticatedError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      (e.extensions?.originalError as { statusCode?: number } | undefined)?.statusCode === 401,
  );
}

type UseHomeDataReturn = {
  data: HomeData | null;
  loading: boolean;
  isUnauthenticated: boolean;
  error: unknown;
  refetch: () => void;
};

export function useHomeData(): UseHomeDataReturn {
  const { data, loading, error, refetch } = useQuery<HomeQueryResult>(HOME_QUERY, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const isUnauthenticated = !loading && !data?.me && isUnauthenticatedError(error);

  if (!data?.me) {
    return { data: null, loading, isUnauthenticated, error, refetch };
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

  return { data: homeData, loading, isUnauthenticated: false, error, refetch };
}
