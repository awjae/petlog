import { ReportGeneratedBy, Species } from '@prisma/client';

export interface ReportContent {
  overview: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export interface HealthReportGenerationParams {
  petId: string;
  petName: string;
  species: Species;
  breed: string | null;
  birthDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
  recordCount: number;
  recordDays: number;
}

export const HEALTH_REPORT_GENERATOR = Symbol('HEALTH_REPORT_GENERATOR');
export const CHATGPT_CLIENT = Symbol('CHATGPT_CLIENT');

// Mock → LLM 전환 시 이 인터페이스만 구현하면 되고, 어떤 구현체를 쓸지는
// AiModule의 DI 팩토리(HEALTH_REPORT_GENERATOR)가 결정한다. ReportService는
// 구현체를 알 필요가 없다.
export interface HealthReportGenerator {
  readonly kind: ReportGeneratedBy;
  generate(params: HealthReportGenerationParams): Promise<ReportContent>;
}
