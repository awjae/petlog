import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { VisitController } from './visit.controller';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])],
  controllers: [VisitController],
  providers: [ThrottlerGuard],
})
export class VisitModule {}
