import { Module } from '@nestjs/common';
import { BreedProfileService } from './breed-profile.service';
import { LlmReportGenerator } from './llm-report.generator';

@Module({
  providers: [BreedProfileService, LlmReportGenerator],
  exports: [BreedProfileService, LlmReportGenerator],
})
export class AiModule {}
