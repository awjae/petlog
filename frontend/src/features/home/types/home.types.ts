// filepath: src/features/home/types/home.types.ts

export type HealthRecordSummary = {
  id: string;
  type: string;
  recordedAt: string;
  summary: string;
};

export type RecentWeight = {
  value: number;
  recordedAt: string;
};

export type Pet = {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  birthDate?: string;
  profileImageUrl?: string;
  recentWeight?: RecentWeight;
  todayRecordCount: number;
  recentHealthRecords: HealthRecordSummary[];
};

export type UpcomingSchedule = {
  id: string;
  petId: string;
  petName: string;
  petProfileImageUrl?: string;
  type: 'vaccination' | 'medication' | 'appointment';
  title: string;
  dueDate: string;
  daysUntil: number;
};

export type HomeData = {
  pets: Pet[];
  upcomingSchedules: UpcomingSchedule[];
};

export type HomeQueryResult = {
  me: {
    pets: Array<{
      id: string;
      name: string;
      species: 'dog' | 'cat' | 'other';
      breed?: string;
      birthDate?: string;
      profileImageUrl?: string;
      recentWeight?: RecentWeight;
      todayRecordCount: number;
      recentHealthRecords: HealthRecordSummary[];
    }>;
    upcomingSchedules: Array<{
      id: string;
      petId: string;
      petName: string;
      petProfileImageUrl?: string;
      type: 'vaccination' | 'medication' | 'appointment';
      title: string;
      dueDate: string;
    }>;
  };
};
