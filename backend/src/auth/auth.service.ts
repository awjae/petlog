import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as Sentry from '@sentry/node';
import {
  buildResetPasswordEmailHtml,
  MAIL_SENDER,
  RESET_PASSWORD_EMAIL_SUBJECT,
} from '@petlog/mail';
import type { MailSender } from '@petlog/mail';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthUser {
  id: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30분
const DELETION_GRACE_PERIOD_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  createTokens(user: AuthUser): TokenPair {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'),
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
  }

  // RTR: 기존 토큰 폐기 → 새 토큰 발급 → DB 저장
  async rotateRefreshToken(userId: string, oldToken: string, user: AuthUser): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash: this.hash(oldToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      // 이미 사용된 토큰이 재사용됨 — 탈취 가능성, 전체 폐기
      await this.revokeAllRefreshTokens(userId);
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다. 다시 로그인해주세요.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = this.createTokens(user);
    await this.storeRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

  // 비밀번호 찾기 요청. 계정 존재 여부를 노출하지 않기 위해(enumeration 방지)
  // 이메일이 존재하지 않아도 조용히 종료하고, 컨트롤러는 항상 동일한 성공 응답을 반환한다.
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) return;

    // 재요청(재전송) 시 기존에 발급했던 미사용 토큰은 모두 무효화한다.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${this.config.getOrThrow('FRONTEND_URL')}/reset-password?token=${rawToken}`;
    const html = buildResetPasswordEmailHtml({ resetUrl });

    // 메일 발송 실패(SES 샌드박스 미검증 수신자 등)가 그대로 전파되면 계정이 존재하지 않는
    // 경우(200)와 상태 코드가 달라져 컨트롤러의 enumeration 방지 계약이 깨진다. 발송 실패는
    // 로깅(Sentry 포함)만 하고 응답은 항상 동일하게 유지한다.
    try {
      await this.mailSender.send(user.email, RESET_PASSWORD_EMAIL_SUBJECT, html);
    } catch (error) {
      this.logger.error(
        `비밀번호 재설정 메일 발송 실패 (userId=${user.id})`,
        error instanceof Error ? error.stack : String(error),
      );
      Sentry.captureException(error);
    }
  }

  // 토큰 검증(GET) — consumedAt을 건드리지 않고 유효성만 확인한다.
  async verifyPasswordResetToken(token: string): Promise<boolean> {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: this.hash(token),
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return !!record;
  }

  // 비밀번호 재설정(POST) — 토큰을 원자적으로 소모(consume)하고, 성공 시에만
  // 비밀번호를 변경한 뒤 전 기기 Refresh Token을 폐기한다.
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hash(token);

    // updateMany + count로 동시 제출(race condition)에도 단 한 번만 소모되도록 한다.
    const consumed = await this.prisma.passwordResetToken.updateMany({
      where: {
        tokenHash,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });

    if (consumed.count !== 1) {
      throw new GoneException('재설정 링크가 만료되었거나 이미 사용되었습니다. 다시 요청해주세요.');
    }

    const record = await this.prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });

    await this.userService.updatePassword(record.userId, newPassword);
    await this.revokeAllRefreshTokens(record.userId);
  }

  // 계정 삭제(탈퇴) 확정 — 본인 확인 후 소프트 삭제(deletionRequestedAt)를 세팅하고
  // 전 기기 Refresh Token을 폐기한다. revokeAllRefreshTokens는 updateMany 기반으로
  // 그 자체로 원자적이라 별도 트랜잭션 클라이언트 없이 기존 메서드를 그대로 재사용한다.
  async withdrawAccount(userId: string, password: string): Promise<void> {
    const valid = await this.userService.verifyPassword(userId, password);
    if (!valid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletionRequestedAt: new Date() },
    });

    await this.revokeAllRefreshTokens(userId);
  }

  // 계정 복구 — 그레이스 기간(30일) 중 재로그인한 사용자가 탈퇴를 취소한다.
  // anonymizedAt이 이미 세팅된(익명화 배치가 실행된) 경우는 복구 불가능한 레이스 상황이므로
  // updateMany + count로 원자적으로 조건부 업데이트한다.
  async restoreAccount(userId: string): Promise<void> {
    const restored = await this.prisma.user.updateMany({
      where: { id: userId, anonymizedAt: null },
      data: { deletionRequestedAt: null },
    });

    if (restored.count !== 1) {
      throw new ConflictException('복구 가능 기간이 지났어요. 새로 가입해주세요.');
    }
  }

  // 로그인 응답에 그레이스 기간 안내를 포함하기 위한 헬퍼.
  getDeletionRemainingDays(deletionRequestedAt: Date | null): number | null {
    if (!deletionRequestedAt) return null;

    const elapsedDays = Math.floor(
      (Date.now() - deletionRequestedAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.max(0, DELETION_GRACE_PERIOD_DAYS - elapsedDays);
  }
}
