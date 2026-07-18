import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ReportService } from './report.service';
import { ReportResolver } from './report.resolver';
import { ReportScheduler } from './report.scheduler';
import { ReportShareService } from './report-share.service';
import { ReportShareResolver } from './report-share.resolver';
import { ReportSharePublicController } from './report-share-public.controller';
import { PetModule } from '../pet/pet.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PetModule,
    AiModule,
    // 공유 리포트 공개 조회(REST) 전용 rate limit(1분당 5회) — AuthModule과 동일한 이유로
    // APP_GUARD 전역 등록 대신 ReportSharePublicController에만 @UseGuards(ThrottlerGuard)로 적용한다.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [ReportSharePublicController],
  providers: [
    ReportService,
    ReportResolver,
    ReportScheduler,
    ReportShareService,
    ReportShareResolver,
    ThrottlerGuard,
  ],
})
export class ReportModule {}
