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
};
