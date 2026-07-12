import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { PushSender } from '../push-sender.interface';

export interface FcmPushSenderConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

const APP_NAME = 'petlog-push';

// Firebase Cloud Messaging 기반 실제 푸시 발송 구현체.
export class FcmPushSender implements PushSender {
  private readonly app: App;

  constructor(config: FcmPushSenderConfig) {
    // 이미 초기화된 앱이 있으면 재사용한다 (예: NestJS 모듈이 여러 번 인스턴스화되는 경우 대비).
    const existing = getApps().find((app) => app.name === APP_NAME);
    this.app =
      existing ??
      initializeApp(
        {
          credential: cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            // .env에는 개행이 \n으로 이스케이프되어 저장되므로 실제 개행 문자로 복원한다.
            privateKey: config.privateKey.replace(/\\n/g, '\n'),
          }),
        },
        APP_NAME,
      );
  }

  async send(token: string, title: string, body: string): Promise<void> {
    await getMessaging(this.app).send({
      token,
      notification: { title, body },
    });
  }
}
