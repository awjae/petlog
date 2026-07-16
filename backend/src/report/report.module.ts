import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportResolver } from './report.resolver';
import { ReportScheduler } from './report.scheduler';
import { PetModule } from '../pet/pet.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PetModule, AiModule],
  providers: [ReportService, ReportResolver, ReportScheduler],
})
export class ReportModule {}
