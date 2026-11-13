import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { UserModule } from '../user/user.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UserModule,
    MailModule,
    // forgot-password/reset-password 엔드포인트 전용 rate limit(1분당 5회, IP 기준).
    // 다른 라우트에는 영향을 주지 않도록 APP_GUARD로 전역 등록하지 않고,
    // AuthController에서 @UseGuards(ThrottlerGuard) + @Throttle로 해당 라우트에만 적용한다.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy, ThrottlerGuard],
  exports: [AuthService],
})
export class AuthModule {}
