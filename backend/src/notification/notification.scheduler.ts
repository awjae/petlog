import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

// 매일 새벽 알림 대상을 스캔해 발송한다. 접종 임박 알림을 먼저 처리하고
// 이어서 건강기록 권장 알림을 처리한다 — 두 스캔은 서로 독립적이라 순서
// 자체는 중요하지 않지만, 실행 로그를 순차적으로 읽기 쉽도록 순서를 고정한다.
@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyScan(): Promise<void> {
    this.logger.log('일일 알림 스캔 시작');
    await this.notificationService.scanAndSendVaccinationDue();
    await this.notificationService.scanAndSendWeeklyCheckin();
    this.logger.log('일일 알림 스캔 종료');
  }
}
