import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VisitService } from './visit.service';

@Injectable()
export class VisitScheduler {
  private readonly logger = new Logger(VisitScheduler.name);

  constructor(private readonly visitService: VisitService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleExpiredVisitCleanup(): Promise<void> {
    const count = await this.visitService.deleteExpired();
    this.logger.log(`만료된 방문 기록 ${count}건 삭제`);
  }
}
