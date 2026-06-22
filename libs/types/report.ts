export enum ReportType {
  Weekly = "weekly",
  Monthly = "monthly",
}

export enum ReportGeneratedBy {
  Mock = "mock",
  AI = "ai",
}

export interface ReportSummary {
  overview: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export interface Report {
  id: string;
  petId: string;
  type: ReportType;
  summary: ReportSummary;
  generatedBy: ReportGeneratedBy;
  createdAt: Date;
}

export type CreateReportInput = Pick<Report, "type">;
