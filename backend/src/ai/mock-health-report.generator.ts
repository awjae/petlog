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

    const { petName, recordCount, recordDays } = params;

    // 생성기는 본문만 만든다. 품종 기반 문구는 BreedProfileService가 덧붙인다.
    const content: ReportContent = {
      overview: `${petName}의 이번 기간 건강 기록을 분석했어요. 전반적으로 안정적인 상태를 유지하고 있습니다.`,
      highlights: [`이번 기간 총 ${recordCount}건의 기록이 ${recordDays}일에 걸쳐 등록되었어요`],
      concerns: [],
      recommendations: ['정기적인 기록을 유지해 더 정확한 분석을 받아보세요'],
    };

    return this.breedProfileService.mergeIntoReport(content, params);
  }
}
