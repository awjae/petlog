import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMailSender, MAIL_SENDER, type MailSender } from '@petlog/mail';

// MailSender를 쓰는 모듈(비밀번호 재설정·주간 요약 메일)이 둘이 되어 AuthModule 안에 있던
// 팩토리를 여기로 옮긴다. 각 모듈이 팩토리를 복사해 두면 MAIL_PROVIDER 판단이 어긋날 수 있다.
// Mock ↔ SES 전환은 @petlog/mail의 팩토리가 결정한다.
@Module({
  providers: [
    {
      provide: MAIL_SENDER,
      useFactory: (config: ConfigService): MailSender => {
        const provider = config.get<string>('MAIL_PROVIDER');
        const region = config.get<string>('AWS_REGION');
        const fromAddress = config.get<string>('MAIL_FROM_ADDRESS');
        return createMailSender({
          provider,
          ses: region && fromAddress ? { region, fromAddress } : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [MAIL_SENDER],
})
export class MailModule {}
