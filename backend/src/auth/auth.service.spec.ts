import { ConflictException, GoneException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import type { MailSender } from '@petlog/mail';

const USER_ID = 'user-1';
const AUTH_USER = { id: USER_ID, email: 'test@petlog.test' };

const CONFIG_VALUES: Record<string, string> = {
  JWT_SECRET: 'access-secret',
  REFRESH_TOKEN_SECRET: 'refresh-secret',
  FRONTEND_URL: 'http://localhost:3000',
};

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let config: { getOrThrow: jest.Mock; get: jest.Mock };
  let prisma: {
    refreshToken: {
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    passwordResetToken: {
      updateMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    user: { update: jest.Mock; updateMany: jest.Mock };
  };
  let userService: { findByEmail: jest.Mock; updatePassword: jest.Mock; verifyPassword: jest.Mock };
  let mailSender: jest.Mocked<MailSender>;

  beforeEach(() => {
    jwtService = { sign: jest.fn(), verify: jest.fn() };
    config = {
      getOrThrow: jest.fn((key: string) => CONFIG_VALUES[key]),
      get: jest.fn((key: string, def?: string) => CONFIG_VALUES[key] ?? def),
    };
    prisma = {
      refreshToken: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      passwordResetToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      user: { update: jest.fn(), updateMany: jest.fn() },
    };
    userService = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
      verifyPassword: jest.fn(),
    };
    mailSender = { send: jest.fn() };

    service = new AuthService(
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
      userService as unknown as UserService,
      mailSender,
    );
  });

  describe('createTokens', () => {
    it('access/refresh 토큰을 각각 알맞은 secret으로 서명한다', () => {
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = service.createTokens(AUTH_USER);

      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: USER_ID, email: AUTH_USER.email },
        expect.objectContaining({ secret: 'access-secret' }),
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: USER_ID, email: AUTH_USER.email },
        expect.objectContaining({ secret: 'refresh-secret' }),
      );
    });
  });

  describe('rotateRefreshToken (RTR)', () => {
    it('유효한 토큰이면 기존 토큰을 폐기하고 새 토큰 쌍을 발급한다', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({ id: 'stored-1' });
      jwtService.sign.mockReturnValueOnce('new-access').mockReturnValueOnce('new-refresh');

      const result = await service.rotateRefreshToken(USER_ID, 'old-token', AUTH_USER);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'stored-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: USER_ID }) }),
      );
      expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });

    it('이미 폐기됐거나 존재하지 않는 토큰이 재사용되면 전 세션을 폐기하고 거부한다', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.rotateRefreshToken(USER_ID, 'stolen-token', AUTH_USER)).rejects.toThrow(
        UnauthorizedException,
      );

      // 탈취 가능성이 있으므로 이 토큰 하나가 아니라 해당 유저의 모든 세션을 폐기해야 한다.
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('유효하면 payload를 반환한다', () => {
      jwtService.verify.mockReturnValue({ sub: USER_ID, email: AUTH_USER.email });

      const result = service.verifyRefreshToken('valid-token');
      expect(result).toEqual({ sub: USER_ID, email: AUTH_USER.email });
    });

    it('만료/변조된 토큰이면 UnauthorizedException을 던진다', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyRefreshToken('expired-token')).toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('존재하지 않는 이메일이면 아무 것도 하지 않고 조용히 종료한다 (enumeration 방지)', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await service.requestPasswordReset('nobody@petlog.test');

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailSender.send).not.toHaveBeenCalled();
    });

    it('존재하는 이메일이면 이전 미사용 토큰을 무효화하고 새 토큰을 발급/발송한다', async () => {
      userService.findByEmail.mockResolvedValue({ id: USER_ID, email: AUTH_USER.email });

      await service.requestPasswordReset(AUTH_USER.email);

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, consumedAt: null, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: USER_ID }) }),
      );
      expect(mailSender.send).toHaveBeenCalledWith(
        AUTH_USER.email,
        expect.any(String),
        expect.stringContaining('reset-password?token='),
      );
    });

    // 메일 발송이 실패해도 예외가 전파되면 안 된다. 전파되면 "계정이 존재할 때만 5xx,
    // 없으면 200"이 되어 상태 코드만으로 가입 여부를 알아낼 수 있고, 위 첫 번째 테스트가
    // 지키는 enumeration 방지 계약이 무너진다.
    it('메일 발송이 실패해도 예외를 전파하지 않는다 (enumeration 방지 계약 유지)', async () => {
      userService.findByEmail.mockResolvedValue({ id: USER_ID, email: AUTH_USER.email });
      mailSender.send.mockRejectedValue(new Error('SES: Email address is not verified'));

      await expect(service.requestPasswordReset(AUTH_USER.email)).resolves.toBeUndefined();
    });

    // 발송에 실패하더라도 토큰 발급 자체는 이미 끝난 상태여야 한다 — 사용자가 메일을 못 받아
    // 재요청했을 때 이전 토큰이 정상적으로 무효화되는 흐름이 유지된다.
    it('메일 발송이 실패해도 토큰은 이미 발급된 상태로 남는다', async () => {
      userService.findByEmail.mockResolvedValue({ id: USER_ID, email: AUTH_USER.email });
      mailSender.send.mockRejectedValue(new Error('SES: Email address is not verified'));

      await service.requestPasswordReset(AUTH_USER.email);

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('유효한 토큰이면 true를 반환한다', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue({ id: 'token-1' });
      await expect(service.verifyPasswordResetToken('token')).resolves.toBe(true);
    });

    it('만료/소모/존재하지 않는 토큰이면 false를 반환한다', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);
      await expect(service.verifyPasswordResetToken('token')).resolves.toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('정상 소모되면 비밀번호를 바꾸고 전 기기 세션을 폐기한다', async () => {
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.passwordResetToken.findUniqueOrThrow.mockResolvedValue({ userId: USER_ID });

      await service.resetPassword('token', 'new-password');

      expect(userService.updatePassword).toHaveBeenCalledWith(USER_ID, 'new-password');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('이미 소모됐거나 만료된 토큰(동시 요청 포함)이면 GoneException을 던진다', async () => {
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.resetPassword('token', 'new-password')).rejects.toThrow(GoneException);
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('withdrawAccount', () => {
    it('비밀번호가 틀리면 거부하고 아무 것도 변경하지 않는다', async () => {
      userService.verifyPassword.mockResolvedValue(false);

      await expect(service.withdrawAccount(USER_ID, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('비밀번호가 맞으면 탈퇴 요청 시각을 기록하고 전 기기 세션을 폐기한다', async () => {
      userService.verifyPassword.mockResolvedValue(true);

      await service.withdrawAccount(USER_ID, 'correct-password');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { deletionRequestedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('restoreAccount', () => {
    it('그레이스 기간 중(익명화 전)이면 복구한다', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });
      await expect(service.restoreAccount(USER_ID)).resolves.toBeUndefined();
    });

    it('이미 익명화됐거나 대상이 없으면 ConflictException을 던진다', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.restoreAccount(USER_ID)).rejects.toThrow(ConflictException);
    });
  });

  describe('getDeletionRemainingDays', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('탈퇴 요청 이력이 없으면 null을 반환한다', () => {
      expect(service.getDeletionRemainingDays(null)).toBeNull();
    });

    it('요청 당일(0일 경과)이면 30을 반환한다', () => {
      const requestedAt = new Date(Date.now());
      expect(service.getDeletionRemainingDays(requestedAt)).toBe(30);
    });

    it('29일 경과했으면 1을 반환한다', () => {
      const requestedAt = new Date(Date.now() - 29 * DAY_MS);
      expect(service.getDeletionRemainingDays(requestedAt)).toBe(1);
    });

    it('정확히 30일 경과했으면 0을 반환한다 (그레이스 기간 마지막 날)', () => {
      const requestedAt = new Date(Date.now() - 30 * DAY_MS);
      expect(service.getDeletionRemainingDays(requestedAt)).toBe(0);
    });

    it('30일을 초과해도 음수가 아니라 0을 반환한다', () => {
      const requestedAt = new Date(Date.now() - 45 * DAY_MS);
      expect(service.getDeletionRemainingDays(requestedAt)).toBe(0);
    });
  });
});
