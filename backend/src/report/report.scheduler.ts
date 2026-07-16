import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportService } from './report.service';

@Injectable()
export class ReportScheduler {
  private readonly logger = new Logger(ReportScheduler.name);

  constructor(private readonly reportService: ReportService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStaleReportCleanup(): Promise<void> {
    this.logger.log('멈춘 리포트 정리 시작');
    await this.reportService.cleanupStaleReports();
    this.logger.log('멈춘 리포트 정리 종료');
  }
}
