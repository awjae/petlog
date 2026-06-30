import { Injectable } from '@nestjs/common';
import { BreedProfileService } from '../ai/breed-profile.service';
import { Species } from '@prisma/client';

export interface MockReportContent {
  overview: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export interface MockReportParams {
  petName: string;
  species: Species;
  breed: string | null;
  birthDate: Date | null;
  recordCount: number;
  recordDays: number;
}

@Injectable()
export class MockReportGenerator {
  constructor(private readonly breedProfileService: BreedProfileService) {}

  async generate(params: MockReportParams): Promise<MockReportContent> {
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
      `이번 달 총 ${recordCount}건의 기록이 ${recordDays}일에 걸쳐 등록되었어요`,
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

    if (alerts.length > 0) {
      recommendations.push(
        `품종 특성상 ${alerts.map((a) => a.condition).join(', ')} 관련 이상 증상이 나타나면 수의사와 상담하세요`,
      );
    }

    return {
      overview: `${petName}의 이번 달 건강 기록을 분석했어요. 전반적으로 안정적인 상태를 유지하고 있습니다.`,
      highlights,
      concerns,
      recommendations,
    };
  }
}
