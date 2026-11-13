import type { HomeQueryQuery } from '@/generated/graphql';

type MeData = NonNullable<HomeQueryQuery['me']>;

export type Pet = MeData['pets'][number];
export type HealthRecordSummary = Pet['recentHealthRecords'][number];
export type RecentWeight = NonNullable<Pet['recentWeight']>;
export type UpcomingScheduleBase = MeData['upcomingSchedules'][number];

export type UpcomingSchedule = UpcomingScheduleBase & {
  daysUntil: number;
};

export type HomeData = {
  pets: Pet[];
  upcomingSchedules: UpcomingSchedule[];
  streak: number;
  /** 연속 기록 계산의 원본. 기록 저장 직후 늘어난 연속 일수를 다시 계산할 때 쓴다. */
  recordDates: readonly string[];
};
