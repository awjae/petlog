import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { createMailSender, MAIL_SENDER, type MailSender } from '@petlog/mail';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UserModule,
    // forgot-password/reset-password 엔드포인트 전용 rate limit(1분당 5회, IP 기준).
    // 다른 라우트에는 영향을 주지 않도록 APP_GUARD로 전역 등록하지 않고,
    // AuthController에서 @UseGuards(ThrottlerGuard) + @Throttle로 해당 라우트에만 적용한다.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshJwtStrategy,
    ThrottlerGuard,
    // AiModule의 HEALTH_REPORT_GENERATOR, UploadModule의 STORAGE_PROVIDER와 동일한 패턴.
    // AuthService는 MailSender 인터페이스만 알면 되고, Mock ↔ SES 전환은 이 팩토리만 바꾸면 된다.
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
  exports: [AuthService],
})
export class AuthModule {}
