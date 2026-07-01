import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthRecordType, Species } from '@prisma/client';
import { ChatGptHealthReportClient } from '@petlog/ai';
import type { HealthReportInput, AppetiteLevel, ActivityLevel } from '@petlog/ai';
import { PrismaService } from '../common/prisma/prisma.service';
import type { MockReportContent } from '../report/mock-report.generator';

export interface LlmReportParams {
  petId: string;
  petName: string;
  species: Species;
  breed: string | null;
  birthDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class LlmReportGenerator {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generate(params: LlmReportParams): Promise<MockReportContent> {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const client = new ChatGptHealthReportClient(apiKey);

    const input = await this.buildInput(params);
    const output = await client.generateReport(input);

    return {
      overview: output.summary,
      highlights: output.trends.map((t) => `${t.category}: ${t.description}`),
      concerns: output.concerns,
      recommendations: output.actions,
    };
  }

  private async buildInput(params: LlmReportParams): Promise<HealthReportInput> {
    const { petId, petName, species, breed, birthDate, periodStart, periodEnd } = params;

    const [records, medications, lastVisit] = await Promise.all([
      this.prisma.healthRecord.findMany({
        where: {
          petId,
          deletedAt: null,
          recordedAt: { gte: periodStart, lte: periodEnd },
        },
        select: { type: true, numValue: true, textValue: true, note: true },
        orderBy: { recordedAt: 'asc' },
      }),
      this.prisma.medication.findMany({
        where: {
          petId,
          deletedAt: null,
          startDate: { lte: periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
        },
        select: { name: true },
      }),
      this.prisma.medicalEvent.findFirst({
        where: { petId, deletedAt: null, visitDate: { lte: periodEnd } },
        orderBy: { visitDate: 'desc' },
        select: { visitDate: true },
      }),
    ]);

    const weights = records
      .filter((r) => r.type === HealthRecordType.weight && r.numValue !== null)
      .map((r) => Number(r.numValue));

    const appetites = records
      .filter((r) => r.type === HealthRecordType.appetite && r.textValue)
      .map((r) => this.mapAppetite(r.textValue!));

    const activities = records
      .filter((r) => r.type === HealthRecordType.activity && r.textValue)
      .map((r) => r.textValue as ActivityLevel);

    const symptoms = records
      .filter((r) => r.type === HealthRecordType.symptom || r.type === HealthRecordType.vomit)
      .map((r) => r.note ?? r.textValue ?? '')
      .filter(Boolean);

    return {
      pet: {
        name: petName,
        species: species.toLowerCase() as 'dog' | 'cat',
        breed: breed ?? null,
        age_months: birthDate ? this.calcAgeMonths(birthDate, periodEnd) : 0,
      },
      period: {
        start: periodStart.toISOString().slice(0, 10),
        end: periodEnd.toISOString().slice(0, 10),
      },
      records: { weight: weights, appetite: appetites, activity: activities },
      symptoms,
      medications: medications.filter((m) => m.name).map((m) => m.name!),
      last_vet_visit: lastVisit ? lastVisit.visitDate.toISOString().slice(0, 10) : null,
    };
  }

  // DB 식욕 값(none|low|normal|high) → ChatGPT 형식(poor|normal|good)
  private mapAppetite(value: string): AppetiteLevel {
    if (value === 'high') return 'good';
    if (value === 'normal') return 'normal';
    return 'poor';
  }

  private calcAgeMonths(birthDate: Date, referenceDate: Date): number {
    return (
      (referenceDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (referenceDate.getMonth() - birthDate.getMonth())
    );
  }
}
