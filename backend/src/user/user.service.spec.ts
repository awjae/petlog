import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { UserService } from './user.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConsentService } from '../consent/consent.service';

const AGREED_ALL = { termsOfService: true, privacyPolicy: true, marketingNotification: true };

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: { findUnique: jest.Mock };
    pet: { findMany: jest.Mock };
    healthRecord: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let consentService: { recordConsents: jest.Mock };
  let txUserCreate: jest.Mock;

  beforeEach(() => {
    txUserCreate = jest.fn().mockResolvedValue({ id: 'user-1', email: 'new@petlog.test' });

    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      pet: { findMany: jest.fn().mockResolvedValue([{ id: 'pet-1' }]) },
      healthRecord: { findMany: jest.fn().mockResolvedValue([]) },
      // 실제 Prisma의 $transaction처럼 콜백에 tx 클라이언트를 전달해 실행한다.
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        cb({ user: { create: txUserCreate } }),
      ),
    };
    consentService = { recordConsents: jest.fn() };

    service = new UserService(
      prisma as unknown as PrismaService,
      consentService as unknown as ConsentService,
    );
  });

  describe('create', () => {
    it('이미 사용 중인 이메일이면 ConflictException을 던지고 트랜잭션을 시작하지 않는다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('dup@petlog.test', 'password123', undefined, AGREED_ALL, {}),
      ).rejects.toThrow(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      ['termsOfService', { ...AGREED_ALL, termsOfService: false }],
      ['privacyPolicy', { ...AGREED_ALL, privacyPolicy: false }],
    ])(
      '필수 항목(%s) 미동의 시 BadRequestException을 던지고 트랜잭션을 시작하지 않는다',
      async (_label, consents) => {
        await expect(
          service.create('new@petlog.test', 'password123', undefined, consents, {}),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      },
    );

    it('마케팅 동의는 선택이라 false여도 가입이 성공한다', async () => {
      const consents = { ...AGREED_ALL, marketingNotification: false };

      const user = await service.create('new@petlog.test', 'password123', '홍길동', consents, {
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
      });

      expect(user).toEqual({ id: 'user-1', email: 'new@petlog.test' });
    });

    it('User 생성과 동의 이력 3건 기록을 같은 트랜잭션 클라이언트로 원자적으로 묶는다', async () => {
      await service.create('new@petlog.test', 'password123', '홍길동', AGREED_ALL, {
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
      });

      expect(txUserCreate).toHaveBeenCalledWith({
        data: {
          email: 'new@petlog.test',
          password: expect.any(String),
          name: '홍길동',
        },
      });

      expect(consentService.recordConsents).toHaveBeenCalledWith(
        'user-1',
        [
          { consentType: ConsentType.termsOfService, agreed: true },
          { consentType: ConsentType.privacyPolicy, agreed: true },
          { consentType: ConsentType.marketingNotification, agreed: true },
        ],
        { ipAddress: '1.2.3.4', userAgent: 'jest' },
        { user: { create: txUserCreate } },
      );
    });
  });
  /**
   * 삭제는 전부 소프트 삭제라, 필터를 빠뜨리면 지운 기록의 날짜에 캘린더 점이 남는다.
   * 타입으로 강제되지 않고 빠뜨려도 아무 데서도 실패하지 않는 종류의 결함이다.
   */
  describe('getRecordDates', () => {
    it('소프트 삭제된 반려동물과 기록을 제외하고 조회한다', async () => {
      await service.getRecordDates('user-1', 90);

      expect(prisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', deletedAt: null } }),
      );
      expect(prisma.healthRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { petId: { in: ['pet-1'] }, deletedAt: null } }),
      );
    });

    it('반려동물이 없으면 기록을 조회하지 않는다', async () => {
      prisma.pet.findMany.mockResolvedValue([]);

      await expect(service.getRecordDates('user-1', 90)).resolves.toEqual([]);
      expect(prisma.healthRecord.findMany).not.toHaveBeenCalled();
    });
  });
});
