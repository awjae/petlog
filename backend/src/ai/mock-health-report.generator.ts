import { Injectable } from '@nestjs/common';
import { ReportGeneratedBy } from '@prisma/client';
import { BreedProfileService } from './breed-profile.service';
import type {
  HealthReportGenerationParams,
  HealthReportGenerator,
  ReportContent,
} from './health-report-generator.interface';

@Injectable()
export class MockHealthReportGenerator implements HealthReportGenerator {
  readonly kind = ReportGeneratedBy.mock;

  constructor(private readonly breedProfileService: BreedProfileService) {}

  async generate(params: HealthReportGenerationParams): Promise<ReportContent> {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 2000 + Math.floor(Math.random() * 1000)),
    );

    const { petName, species, breed, birthDate, recordCount, recordDays } = params;

    const alerts = this.breedProfileService.getBreedAlerts(
      species as 'dog' | 'cat',
      breed,
      birthDate,
    );
    const lifeStage = this.breedProfileService.getLifeStageInfo(
      species as 'dog' | 'cat',
      breed,
      birthDate,
    );

    const highlights: string[] = [
      `이번 기간 총 ${recordCount}건의 기록이 ${recordDays}일에 걸쳐 등록되었어요`,
    ];

    if (lifeStage?.is_senior) {
      highlights.push(
        `${petName}는 노령기에 접어들었어요. ${lifeStage.recommended_checkup}을 권장해요`,
      );
    }

    const concerns: string[] = alerts
      .filter((a) => a.risk_level === 'high')
      .map((a) => `${a.condition} 위험이 있어요. ${a.watch_for.join(', ')} 증상을 주의하세요`);

    const recommendations: string[] = ['정기적인 기록을 유지해 더 정확한 분석을 받아보세요'];

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

    return {
      overview: `${petName}의 이번 기간 건강 기록을 분석했어요. 전반적으로 안정적인 상태를 유지하고 있습니다.`,
      highlights,
      concerns,
      recommendations,
    };
  }
}
