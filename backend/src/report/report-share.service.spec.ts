import { NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { ReportStatus } from '@prisma/client';
import { ReportShareService } from './report-share.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportService } from './report.service';

const USER_ID = 'user-1';
const REPORT_ID = 'report-1';
const TOKEN_HEX_LENGTH = 64; // randomBytes(32).toString('hex')

function buildReport(overrides: Partial<{ status: ReportStatus }> = {}) {
  return { id: REPORT_ID, status: ReportStatus.completed, ...overrides };
}

describe('ReportShareService', () => {
  let service: ReportShareService;
  let prisma: {
    reportShare: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
  };
  let reportService: { assertOwnership: jest.Mock };

  beforeEach(() => {
    prisma = {
      reportShare: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    reportService = { assertOwnership: jest.fn().mockResolvedValue(buildReport()) };

    service = new ReportShareService(
      prisma as unknown as PrismaService,
      reportService as unknown as ReportService,
    );
  });

  describe('소유권 검증', () => {
    it('getShareSettings는 ReportService.assertOwnership을 통해 소유권을 검증한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue(null);

      await service.getShareSettings(USER_ID, REPORT_ID);

      expect(reportService.assertOwnership).toHaveBeenCalledWith(USER_ID, REPORT_ID);
    });

    it('본인 소유가 아니면(assertOwnership이 던지면) 그대로 전파한다', async () => {
      reportService.assertOwnership.mockRejectedValue(
        new NotFoundException('리포트를 찾을 수 없습니다.'),
      );

      await expect(service.startShare(USER_ID, REPORT_ID)).rejects.toThrow(NotFoundException);
      expect(prisma.reportShare.upsert).not.toHaveBeenCalled();
    });
  });

  describe('완료되지 않은 리포트는 공유 작업을 거부한다', () => {
    it.each([ReportStatus.pending, ReportStatus.processing, ReportStatus.failed])(
      'status=%s인 리포트는 startShare를 거부한다',
      async (status) => {
        reportService.assertOwnership.mockResolvedValue(buildReport({ status }));

        await expect(service.startShare(USER_ID, REPORT_ID)).rejects.toMatchObject({
          message: '완료된 리포트만 공유할 수 있습니다.',
          extensions: { code: 'BAD_REQUEST' },
        });
        expect(prisma.reportShare.upsert).not.toHaveBeenCalled();
      },
    );

    it('status가 completed가 아니면 stopShare도 거부한다', async () => {
      reportService.assertOwnership.mockResolvedValue(buildReport({ status: ReportStatus.failed }));

      await expect(service.stopShare(USER_ID, REPORT_ID)).rejects.toThrow(GraphQLError);
      expect(prisma.reportShare.findUnique).not.toHaveBeenCalled();
    });

    it('status가 completed가 아니면 setIncludeConcerns도 거부한다', async () => {
      reportService.assertOwnership.mockResolvedValue(
        buildReport({ status: ReportStatus.processing }),
      );

      await expect(service.setIncludeConcerns(USER_ID, REPORT_ID, true)).rejects.toThrow(
        GraphQLError,
      );
      expect(prisma.reportShare.upsert).not.toHaveBeenCalled();
    });

    it('status가 completed가 아니면 getShareSettings도 거부한다', async () => {
      reportService.assertOwnership.mockResolvedValue(
        buildReport({ status: ReportStatus.pending }),
      );

      await expect(service.getShareSettings(USER_ID, REPORT_ID)).rejects.toThrow(GraphQLError);
      expect(prisma.reportShare.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('startShare — 토큰 재사용(upsert 동작)', () => {
    it('최초 공유 시 새 토큰을 생성해 create한다', async () => {
      prisma.reportShare.upsert.mockResolvedValue({
        isActive: true,
        includeConcerns: false,
        shareToken: 'generated-token',
      });

      await service.startShare(USER_ID, REPORT_ID);

      expect(prisma.reportShare.upsert).toHaveBeenCalledWith({
        where: { reportId: REPORT_ID },
        create: {
          reportId: REPORT_ID,
          shareToken: expect.stringMatching(new RegExp(`^[0-9a-f]{${TOKEN_HEX_LENGTH}}$`)),
          isActive: true,
        },
        update: { isActive: true },
      });
    });

    it('재공유 시 update 절에 shareToken을 포함하지 않는다 (토큰 재사용 보장)', async () => {
      prisma.reportShare.upsert.mockResolvedValue({
        isActive: true,
        includeConcerns: false,
        shareToken: 'existing-token',
      });

      await service.startShare(USER_ID, REPORT_ID);

      const call = prisma.reportShare.upsert.mock.calls[0][0];
      expect(call.update).not.toHaveProperty('shareToken');
      expect(call.update).toEqual({ isActive: true });
    });

    it('upsert 결과를 그대로 설정값으로 반환한다', async () => {
      prisma.reportShare.upsert.mockResolvedValue({
        isActive: true,
        includeConcerns: true,
        shareToken: 'existing-token',
      });

      const result = await service.startShare(USER_ID, REPORT_ID);

      expect(result).toEqual({
        isActive: true,
        includeConcerns: true,
        shareToken: 'existing-token',
      });
    });
  });

  describe('stopShare', () => {
    it('공유한 적이 없으면(행 없음) update 없이 기본값을 반환한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue(null);

      const result = await service.stopShare(USER_ID, REPORT_ID);

      expect(prisma.reportShare.update).not.toHaveBeenCalled();
      expect(result).toEqual({ isActive: false, includeConcerns: false, shareToken: null });
    });

    it('공유 중이면 isActive를 false로 업데이트한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: true,
        includeConcerns: false,
        shareToken: 'existing-token',
      });
      prisma.reportShare.update.mockResolvedValue({
        isActive: false,
        includeConcerns: false,
        shareToken: 'existing-token',
      });

      const result = await service.stopShare(USER_ID, REPORT_ID);

      expect(prisma.reportShare.update).toHaveBeenCalledWith({
        where: { reportId: REPORT_ID },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
      expect(result.shareToken).toBe('existing-token');
    });
  });

  describe('setIncludeConcerns', () => {
    it('공유한 적이 없어도 upsert로 concerns 설정만 미리 저장할 수 있다 (isActive는 그대로 false)', async () => {
      prisma.reportShare.upsert.mockResolvedValue({
        isActive: false,
        includeConcerns: true,
        shareToken: 'generated-token',
      });

      await service.setIncludeConcerns(USER_ID, REPORT_ID, true);

      expect(prisma.reportShare.upsert).toHaveBeenCalledWith({
        where: { reportId: REPORT_ID },
        create: {
          reportId: REPORT_ID,
          shareToken: expect.any(String),
          isActive: false,
          includeConcerns: true,
        },
        update: { includeConcerns: true },
      });
    });
  });

  describe('getShareSettings', () => {
    it('공유한 적이 없으면 기본값(비활성, 토큰 없음)을 반환한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue(null);

      const result = await service.getShareSettings(USER_ID, REPORT_ID);

      expect(result).toEqual({ isActive: false, includeConcerns: false, shareToken: null });
    });

    it('기존 설정이 있으면 그대로 반환한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: true,
        includeConcerns: true,
        shareToken: 'existing-token',
      });

      const result = await service.getShareSettings(USER_ID, REPORT_ID);

      expect(result).toEqual({
        isActive: true,
        includeConcerns: true,
        shareToken: 'existing-token',
      });
    });
  });

  describe('getPublicReport — 공개 조회 (assertOwnership을 거치지 않는다)', () => {
    const baseReport = {
      overview: '전반적으로 양호해요',
      highlights: ['체중 안정적'],
      concerns: ['식욕 감소 관찰됨'],
      recommendations: ['정기 검진 권장'],
      periodStart: new Date('2026-06-01'),
      periodEnd: new Date('2026-06-30'),
      createdAt: new Date('2026-07-01'),
      pet: { name: 'Choco' },
    };

    it('이 메서드는 ReportService.assertOwnership을 호출하지 않는다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue(null);

      await service.getPublicReport('some-token');

      expect(reportService.assertOwnership).not.toHaveBeenCalled();
    });

    it('토큰이 존재하지 않으면 null을 반환한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue(null);

      const result = await service.getPublicReport('unknown-token');

      expect(result).toBeNull();
    });

    it('isActive=false면 토큰이 존재해도 null을 반환한다 (미존재와 동일하게 취급)', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: false,
        includeConcerns: true,
        report: baseReport,
      });

      const result = await service.getPublicReport('deactivated-token');

      expect(result).toBeNull();
    });

    it('includeConcerns=true면 concerns를 포함해 반환한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: true,
        includeConcerns: true,
        report: baseReport,
      });

      const result = await service.getPublicReport('active-token');

      expect(result).toMatchObject({ petName: 'Choco', concerns: baseReport.concerns });
    });

    it('includeConcerns=false면 concerns 필드 자체를 응답에서 제외한다 (빈 배열이 아니라 없음)', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: true,
        includeConcerns: false,
        report: baseReport,
      });

      const result = await service.getPublicReport('active-token');

      expect(result).not.toHaveProperty('concerns');
      expect(result).toMatchObject({
        petName: 'Choco',
        overview: baseReport.overview,
        highlights: baseReport.highlights,
        recommendations: baseReport.recommendations,
      });
    });

    it('계정 식별 정보나 generatedBy 없이 petName만 노출한다', async () => {
      prisma.reportShare.findUnique.mockResolvedValue({
        isActive: true,
        includeConcerns: false,
        report: { ...baseReport, generatedBy: 'mock' },
      });

      const result = await service.getPublicReport('active-token');

      expect(result).not.toHaveProperty('generatedBy');
      expect(result).not.toHaveProperty('petId');
      expect(result).not.toHaveProperty('userId');
    });
  });
});
