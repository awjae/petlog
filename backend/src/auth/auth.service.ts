import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
}
