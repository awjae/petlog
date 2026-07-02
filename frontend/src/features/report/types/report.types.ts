export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type GeneratedBy = 'mock' | 'ai';

export interface ProcessingReport {
  id: string;
  status: ReportStatus;
}

export interface ReportStatusResult {
  canGenerateThisMonth: boolean;
  hasEnoughRecords: boolean;
  recordCount: number;
  recordDays: number;
  nextAvailableAt: string | null;
  processingReport: ProcessingReport | null;
}

export interface Report {
  id: string;
  petId?: string | null;
  status: ReportStatus;
  overview: string | null;
  highlights: string[] | null;
  concerns: string[] | null;
  recommendations: string[] | null;
  generatedBy: GeneratedBy;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface GenerateReportResult {
  reportId: string;
  status: ReportStatus;
}

export interface ReportPollStatus {
  id: string;
  status: ReportStatus;
  failedReason: string | null;
}

export interface ReportPeriodPreviewResult {
  recordCount: number;
  recordDays: number;
  hasEnoughRecords: boolean;
}

export interface PetBasic {
  id: string;
  name: string;
  createdAt: string;
}
