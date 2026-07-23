import { ConsentType } from '@prisma/client';
import { ConsentService } from './consent.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CONSENT_POLICY_VERSIONS } from './consent.constants';

describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: {
    userConsent: { createMany: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      userConsent: { createMany: jest.fn(), findFirst: jest.fn() },
    };
    service = new ConsentService(prisma as unknown as PrismaService);
  });

  describe('recordConsents', () => {
    it('각 항목에 정책 버전을 붙여 append-only로 기록한다', async () => {
      await service.recordConsents(
        'user-1',
        [
          { consentType: ConsentType.termsOfService, agreed: true },
          { consentType: ConsentType.marketingNotification, agreed: false },
        ],
        { ipAddress: '1.2.3.4', userAgent: 'jest' },
      );

      expect(prisma.userConsent.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-1',
            consentType: ConsentType.termsOfService,
            agreed: true,
            policyVersion: CONSENT_POLICY_VERSIONS.termsOfService,
            ipAddress: '1.2.3.4',
            userAgent: 'jest',
          },
          {
            userId: 'user-1',
            consentType: ConsentType.marketingNotification,
            agreed: false,
            policyVersion: CONSENT_POLICY_VERSIONS.marketingNotification,
            ipAddress: '1.2.3.4',
            userAgent: 'jest',
          },
        ],
      });
    });

    it('tx가 주어지면 PrismaService 대신 해당 트랜잭션 클라이언트를 사용한다', async () => {
      const tx = { userConsent: { createMany: jest.fn() } };

      await service.recordConsents(
        'user-1',
        [{ consentType: ConsentType.termsOfService, agreed: true }],
        {},
        tx as never,
      );

      expect(tx.userConsent.createMany).toHaveBeenCalled();
      expect(prisma.userConsent.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getMarketingConsentStatus', () => {
    it('가장 최근 행의 agreed 값을 반환한다', async () => {
      prisma.userConsent.findFirst.mockResolvedValue({ agreed: true });

      const result = await service.getMarketingConsentStatus('user-1');

      expect(result).toBe(true);
      expect(prisma.userConsent.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', consentType: ConsentType.marketingNotification },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('행이 없으면 false를 반환한다', async () => {
      prisma.userConsent.findFirst.mockResolvedValue(null);

      const result = await service.getMarketingConsentStatus('user-1');

      expect(result).toBe(false);
    });
  });

  describe('updateMarketingConsent', () => {
    it('새 행을 추가하고 변경된 agreed 값을 반환한다', async () => {
      const result = await service.updateMarketingConsent('user-1', true, {
        ipAddress: '1.2.3.4',
      });

      expect(result).toBe(true);
      expect(prisma.userConsent.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-1',
            consentType: ConsentType.marketingNotification,
            agreed: true,
          }),
        ],
      });
    });
  });
});
