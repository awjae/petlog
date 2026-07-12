import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPushSender, PUSH_SENDER, type PushSender } from '@petlog/push';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { NotificationScheduler } from './notification.scheduler';

@Module({
  providers: [
    NotificationService,
    NotificationResolver,
    NotificationScheduler,
    // AiModule의 HEALTH_REPORT_GENERATOR, AuthModule의 MAIL_SENDER와 동일한 패턴.
    // NotificationService는 PushSender 인터페이스만 알면 되고, Mock ↔ FCM 전환은
    // 이 팩토리만 바꾸면 된다. FIREBASE_* 환경변수 중 하나라도 비어있으면 Mock을 사용한다.
    {
      provide: PUSH_SENDER,
      useFactory: (config: ConfigService): PushSender => {
        const projectId = config.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY');
        return createPushSender({
          fcm:
            projectId && clientEmail && privateKey
              ? { projectId, clientEmail, privateKey }
              : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class NotificationModule {}
