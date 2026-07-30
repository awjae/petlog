import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

// 매일 아침 9시(KST)에 알림 대상을 스캔해 발송한다. 새벽 시간대는 알림 수신
// 경험상 부적절해 모든 스캔을 9시 하나로 통합했다 — 세 스캔은 서로
// 독립적이라 순서 자체는 중요하지 않지만, 실행 로그를 순차적으로 읽기
// 쉽도록 순서를 고정한다.
//
// timeZone을 명시하지 않으면 프로세스 TZ(컨테이너 기본값 UTC)로 해석돼
// 09:00 UTC = KST 18:00에 발송됐다. 아침에 보내려던 알림이 저녁에 나갔다.
@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'Asia/Seoul' })
  async handleDailyScan(): Promise<void> {
    this.logger.log('일일 알림 스캔 시작');
    await this.notificationService.scanAndSendVaccinationDue();
    await this.notificationService.scanAndSendAppointmentReminder();
    await this.notificationService.scanAndSendWeeklyCheckin();
    this.logger.log('일일 알림 스캔 종료');
  }
}
