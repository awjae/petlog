import { Inject, Injectable } from '@nestjs/common';
import { HealthRecordType, ReportGeneratedBy } from '@prisma/client';
import { ChatGptHealthReportClient } from '@petlog/ai';
import type { HealthReportInput, AppetiteLevel, ActivityLevel } from '@petlog/ai';
import { PrismaService } from '../common/prisma/prisma.service';
import { kstDateString } from '../common/utils/date';
import { BreedProfileService } from './breed-profile.service';
import { toAppetiteLevel, toActivityLevel } from './record-value.mapper';
import {
  CHATGPT_CLIENT,
  type HealthReportGenerationParams,
  type HealthReportGenerator,
  type ReportContent,
} from './health-report-generator.interface';

@Injectable()
export class LlmHealthReportGenerator implements HealthReportGenerator {
  readonly kind = ReportGeneratedBy.ai;

  constructor(
    @Inject(CHATGPT_CLIENT) private readonly client: ChatGptHealthReportClient | null,
    private readonly prisma: PrismaService,
    private readonly breedProfileService: BreedProfileService,
  ) {}

  async generate(params: HealthReportGenerationParams): Promise<ReportContent> {
    if (!this.client) {
      // AiModule의 HEALTH_REPORT_GENERATOR 팩토리가 OPENAI_API_KEY 존재 여부로
      // 이 구현체를 선택하므로, 정상 흐름에서는 도달하지 않는다.
      throw new Error('ChatGPT client가 설정되지 않았습니다 (OPENAI_API_KEY 누락).');
    }

    const input = await this.buildInput(params);
    const output = await this.client.generateReport(input);

    const content: ReportContent = {
      overview: output.summary,
      highlights: output.trends.map((t) => `${t.category}: ${t.description}`),
      concerns: output.concerns,
      recommendations: output.actions,
    };

    // LLM 프롬프트/파인튜닝 모델은 건드리지 않고 응답에 규칙 기반 문구만 덧붙인다.
    return this.breedProfileService.mergeIntoReport(content, params);
  }

  private async buildInput(params: HealthReportGenerationParams): Promise<HealthReportInput> {
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
      .filter((r) => r.type === HealthRecordType.appetite)
      .map((r) => toAppetiteLevel(r.textValue))
      .filter((level): level is AppetiteLevel => level !== null);

    const activities = records
      .filter((r) => r.type === HealthRecordType.activity)
      .map((r) => toActivityLevel(r.textValue))
      .filter((level): level is ActivityLevel => level !== null);

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
      // KST 달력 기준으로 뽑는다. periodStart는 KST 자정(= 전날 15:00Z)이라
      // UTC로 자르면 화면·OG(reportFormat.ts는 Asia/Seoul)와 하루 어긋난다.
      period: {
        start: kstDateString(periodStart),
        end: kstDateString(periodEnd),
      },
      records: { weight: weights, appetite: appetites, activity: activities },
      symptoms,
      medications: medications.filter((m) => m.name).map((m) => m.name!),
      last_vet_visit: lastVisit ? kstDateString(lastVisit.visitDate) : null,
    };
  }

  private calcAgeMonths(birthDate: Date, referenceDate: Date): number {
    return (
      (referenceDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (referenceDate.getMonth() - birthDate.getMonth())
    );
  }
}
