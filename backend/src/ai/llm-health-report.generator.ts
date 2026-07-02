import { Inject, Injectable } from '@nestjs/common';
import { HealthRecordType, ReportGeneratedBy } from '@prisma/client';
import { ChatGptHealthReportClient } from '@petlog/ai';
import type { HealthReportInput, AppetiteLevel, ActivityLevel } from '@petlog/ai';
import { PrismaService } from '../common/prisma/prisma.service';
import { BreedProfileService } from './breed-profile.service';
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

    return this.mergeBreedProfile(content, params);
  }

  // Mock 생성기와 동일한 규칙으로 breed-profile(품종별 위험질환/생애주기) 결과를 후처리 병합한다.
  // LLM 프롬프트/파인튜닝 모델은 건드리지 않고 응답에 규칙 기반 문구만 덧붙인다.
  private mergeBreedProfile(
    content: ReportContent,
    params: HealthReportGenerationParams,
  ): ReportContent {
    const { petName, species, breed, birthDate } = params;
    const speciesKey = species.toLowerCase() as 'dog' | 'cat';

    const alerts = this.breedProfileService.getBreedAlerts(speciesKey, breed, birthDate);
    const lifeStage = this.breedProfileService.getLifeStageInfo(speciesKey, breed, birthDate);

    const highlights = [...content.highlights];
    if (lifeStage?.is_senior) {
      highlights.push(
        `${petName}는 노령기에 접어들었어요. ${lifeStage.recommended_checkup}을 권장해요`,
      );
    }

    const concerns = [
      ...content.concerns,
      ...alerts
        .filter((a) => a.risk_level === 'high')
        .map((a) => `${a.condition} 위험이 있어요. ${a.watch_for.join(', ')} 증상을 주의하세요`),
    ];

    const recommendations = [...content.recommendations];
    // high는 concerns에서 이미 다루므로, medium은 recommendations에서 조건별로 개별 안내한다.
    if (breed) {
      recommendations.push(
        ...alerts
          .filter((a) => a.risk_level === 'medium')
          .map(
            (a) =>
              `${breed} 품종은 ${a.condition} 발병률이 상대적으로 높아요. ${a.watch_for.join(', ')} 증상이 보이면 미리 관리해주세요`,
          ),
      );
    }

    return { ...content, highlights, concerns, recommendations };
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
