import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { VisitController } from './visit.controller';
import { VisitScheduler } from './visit.scheduler';
import { VisitService } from './visit.service';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])],
  controllers: [VisitController],
  providers: [ThrottlerGuard, VisitService, VisitScheduler],
})
export class VisitModule {}
