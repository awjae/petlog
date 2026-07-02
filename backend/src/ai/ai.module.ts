import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGptHealthReportClient } from '@petlog/ai';
import { BreedProfileService } from './breed-profile.service';
import { MockHealthReportGenerator } from './mock-health-report.generator';
import { LlmHealthReportGenerator } from './llm-health-report.generator';
import {
  CHATGPT_CLIENT,
  HEALTH_REPORT_GENERATOR,
  type HealthReportGenerator,
} from './health-report-generator.interface';

@Module({
  providers: [
    BreedProfileService,
    MockHealthReportGenerator,
    LlmHealthReportGenerator,
    {
      provide: CHATGPT_CLIENT,
      useFactory: (config: ConfigService): ChatGptHealthReportClient | null => {
        const apiKey = config.get<string>('OPENAI_API_KEY');
        return apiKey ? new ChatGptHealthReportClient(apiKey) : null;
      },
      inject: [ConfigService],
    },
    // Mock ↔ LLM 중 어떤 구현체를 쓸지는 여기서 한 번만 결정한다.
    // ReportService는 HealthReportGenerator 인터페이스만 알면 되고,
    // Provider 교체는 이 팩토리만 바꾸면 된다.
    {
      provide: HEALTH_REPORT_GENERATOR,
      useFactory: (
        config: ConfigService,
        mock: MockHealthReportGenerator,
        llm: LlmHealthReportGenerator,
      ): HealthReportGenerator => (config.get<string>('OPENAI_API_KEY') ? llm : mock),
      inject: [ConfigService, MockHealthReportGenerator, LlmHealthReportGenerator],
    },
  ],
  exports: [BreedProfileService, HEALTH_REPORT_GENERATOR],
})
export class AiModule {}
