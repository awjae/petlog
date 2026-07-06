import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { MailSender } from '../mail-sender.interface';

export interface SesMailSenderConfig {
  region: string;
  fromAddress: string;
}

// AWS SES 기반 실제 이메일 발송 구현체.
//
// 주의(샌드박스 모드): SES는 프로덕션 액세스(Production Access)를 신청해
// 승인받기 전까지 샌드박스 모드로 동작한다. 샌드박스 모드에서는 발신 주소뿐
// 아니라 수신 주소도 SES 콘솔에서 사전 검증(Verified Identity)해야 발송이
// 가능하고, 하루 발송량과 초당 발송 속도에도 제한이 걸린다. 실제 가입자에게
// 비밀번호 재설정 메일을 보내려면 프로덕션 액세스 승인이 선행되어야 한다.
export class SesMailSender implements MailSender {
  private readonly client: SESClient;
  private readonly fromAddress: string;

  constructor(config: SesMailSenderConfig) {
    this.client = new SESClient({ region: config.region });
    this.fromAddress = config.fromAddress;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: this.fromAddress,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      }),
    );
  }
}
