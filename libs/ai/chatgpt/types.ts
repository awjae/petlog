export type AppetiteLevel = 'good' | 'normal' | 'poor';
export type ActivityLevel = 'high' | 'normal' | 'low';
export type TrendStatus = 'good' | 'normal' | 'caution';

export interface HealthReportInput {
  pet: {
    name: string;
    species: 'dog' | 'cat';
    breed: string | null;
    age_months: number;
  };
  period: {
    start: string;
    end: string;
  };
  records: {
    weight: number[];
    appetite: AppetiteLevel[];
    activity: ActivityLevel[];
  };
  symptoms: string[];
  medications: string[];
  last_vet_visit: string | null;
}

export interface HealthReportTrend {
  category: string;
  status: TrendStatus;
  description: string;
}

export interface HealthReportOutput {
  summary: string;
  trends: HealthReportTrend[];
  concerns: string[];
  actions: string[];
}
