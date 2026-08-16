import { NotFoundException } from '@nestjs/common';
import { ReportGeneratedBy, ReportStatus, Species } from '@prisma/client';
import { ReportService } from './report.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import type { HealthReportGenerator } from '../ai/health-report-generator.interface';

const USER_ID = 'user-1';
const PET_ID = 'pet-1';

function buildPet(overrides: Partial<{ createdAt: Date }> = {}) {
  return {
    id: PET_ID,
    userId: USER_ID,
    name: 'Choco',
    species: Species.dog,
    breed: 'poodle',
    birthDate: new Date(2020, 0, 1),
    createdAt: new Date(2020, 0, 1),
    ...overrides,
  };
}

// count일과 recordDays일 두 게이팅을 동시에 만족하는 기록 목록을 만든다.
// 기본값(7일 × 2건)은 MIN_RECORD_COUNT(10)/MIN_RECORD_DAYS(7)를 모두 넉넉히 넘긴다.
function buildRecords(days: number, perDay = 2): { recordedAt: Date }[] {
  const records: { recordedAt: Date }[] = [];
  for (let d = 0; d < days; d++) {
    for (let i = 0; i < perDay; i++) {
      records.push({ recordedAt: new Date(2024, 0, 1 + d, 9 + i) });
    }
  }
  return records;
}

const SUFFICIENT_RECORDS = buildRecords(7, 2);

/**
 * KST 벽시계 문자열을 UTC 인스턴트로 바꾼다.
 *
 * 프론트는 `new Date('2026-08-16T23:59:59')`처럼 Z 없이 파싱해 **브라우저 로컬**
 * 기준으로 보낸다(reportPeriod.ts의 toStartOfDayIso/toEndOfDayIso). 한국 사용자
 * 기준으로는 이 함수가 만드는 값과 같다.
 *
 * **타임존 경계를 검증하는 테스트는 이 헬퍼를 쓴다.** `new Date(2024, 0, 1)`은
 * 프로세스 TZ(테스트는 UTC)를 따라 자정이 되는데, 그 값은 KST 경계를 넘지 않아
 * 경계 버그를 통과시킨다 — 실제로 "최근 90일" 프리셋이 거부되던 버그가 그렇게
 * 숨어 있었다.
 *
 * 반대로 기간 길이 산술(7일/90일 판정)처럼 타임존과 무관한 검증은 아래 기존
 * 테스트들처럼 `new Date(y, m, d)`를 그대로 써도 된다.
 */
function kst(wallClock: string): Date {
  return new Date(`${wallClock}+09:00`);
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('ReportService', () => {
  let service: ReportService;
  let prisma: {
    healthRecord: { findMany: jest.Mock };
    report: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let petService: { assertOwnership: jest.Mock };
  let generator: jest.Mocked<HealthReportGenerator>;

  beforeEach(() => {
    prisma = {
      healthRecord: { findMany: jest.fn() },
      report: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    petService = { assertOwnership: jest.fn().mockResolvedValue(buildPet()) };
    generator = {
      kind: ReportGeneratedBy.mock,
      generate: jest.fn(),
    };

    service = new ReportService(
      prisma as unknown as PrismaService,
      petService as unknown as PetService,
      generator,
    );
  });

  describe('generateReport — assertValidPeriod', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.create.mockResolvedValue({ id: 'report-1', status: ReportStatus.pending });
    });

    it('종료일이 시작일보다 이전이면 거부한다', async () => {
      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 10), new Date(2024, 0, 1)),
      ).rejects.toMatchObject({
        message: '종료일은 시작일보다 이후여야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });

    it('정확히 7일(최소 기간)은 통과한다', async () => {
      const result = await service.generateReport(
        USER_ID,
        PET_ID,
        new Date(2024, 0, 1),
        new Date(2024, 0, 7),
      );
      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
    });

    it('정확히 90일(최대 기간)은 통과한다', async () => {
      // Date는 day 인자의 overflow를 자동으로 다음 달로 정규화하므로, "1/1 + 89일"을
      // 직접 계산해 하드코딩한 날짜보다 오차 없이 정확히 90일째(양 끝 포함)를 가리킨다.
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 1 + 89);

      const result = await service.generateReport(USER_ID, PET_ID, start, end);
      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
    });

    it('6일(최소 미달)은 거부한다', async () => {
      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 6)),
      ).rejects.toMatchObject({
        message: '분석 기간은 7일 이상 90일 이하로 지정해야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });

    it('91일(최대 초과)은 거부한다', async () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 1 + 90);

      await expect(service.generateReport(USER_ID, PET_ID, start, end)).rejects.toMatchObject({
        message: '분석 기간은 7일 이상 90일 이하로 지정해야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });

    it('오늘을 종료일로 선택해도 "미래" 오류로 거부되지 않는다 (회귀)', async () => {
      // KST 8/16 새벽 2시 = UTC 8/15 17:00. "오늘"을 UTC 달력으로 잡으면 8/15가 되어,
      // 사용자가 고른 8/16이 미래로 판정돼 거부됐다.
      jest.useFakeTimers().setSystemTime(kst('2026-08-16T02:00:00'));
      petService.assertOwnership.mockResolvedValue(
        buildPet({ createdAt: kst('2020-01-01T00:00:00') }),
      );

      const result = await service.generateReport(
        USER_ID,
        PET_ID,
        kst('2026-08-10T00:00:00'),
        kst('2026-08-16T23:59:59'),
      );
      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
    });

    it('등록 당일 00:00을 시작일로 선택해도 "등록일 이전" 오류로 거부되지 않는다 (회귀)', async () => {
      // 가입은 당일 오후(15:30)에 했지만, 리포트 시작일로는 그날 00:00을 고르는
      // 정상적인 시나리오다 — 시각까지 비교하면 "가입 시각보다 이전"으로 잘못 거부된다.
      petService.assertOwnership.mockResolvedValue(
        buildPet({ createdAt: kst('2024-01-01T15:30:00') }),
      );

      const result = await service.generateReport(
        USER_ID,
        PET_ID,
        kst('2024-01-01T00:00:00'),
        kst('2024-01-07T23:59:59'),
      );
      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
    });

    it('프론트의 "최근 90일" 프리셋(KST 기준)을 거부하지 않는다 (회귀)', async () => {
      // 프론트는 addDays(today, -89) ~ today를 보낸다 — 양 끝 포함 정확히 90일이다.
      // 이전에는 서버가 UTC 달력으로 시작일을 하루 앞으로 접어 91일로 세고,
      // "90일 이하" 조건에 걸려 프리셋 자체가 거부됐다.
      jest.useFakeTimers().setSystemTime(kst('2026-08-16T12:00:00'));
      petService.assertOwnership.mockResolvedValue(
        buildPet({ createdAt: kst('2020-01-01T00:00:00') }),
      );

      const result = await service.generateReport(
        USER_ID,
        PET_ID,
        kst('2026-05-19T00:00:00'), // 8/16에서 89일 전 = 양 끝 포함 90일
        kst('2026-08-16T23:59:59'),
      );
      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
    });

    it('KST 기준 91일은 여전히 거부한다', async () => {
      jest.useFakeTimers().setSystemTime(kst('2026-08-16T12:00:00'));
      petService.assertOwnership.mockResolvedValue(
        buildPet({ createdAt: kst('2020-01-01T00:00:00') }),
      );

      await expect(
        service.generateReport(
          USER_ID,
          PET_ID,
          kst('2026-05-18T00:00:00'), // 하루 더 앞 = 91일
          kst('2026-08-16T23:59:59'),
        ),
      ).rejects.toMatchObject({
        message: '분석 기간은 7일 이상 90일 이하로 지정해야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });

    it('반려동물 등록일 이전 날짜를 시작일로 선택하면 거부한다', async () => {
      petService.assertOwnership.mockResolvedValue(buildPet({ createdAt: new Date(2024, 5, 1) }));

      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 4, 1), new Date(2024, 4, 7)),
      ).rejects.toMatchObject({
        message: '시작일은 반려동물 등록일 이후여야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });
  });

  describe('generateReport — 월 1회 생성 게이팅', () => {
    it('이번 달에 이미 진행 중/완료된 리포트가 있으면 거부한다', async () => {
      prisma.report.findFirst.mockResolvedValue({
        id: 'existing-report',
        status: ReportStatus.completed,
      });
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);

      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 7)),
      ).rejects.toMatchObject({
        message: '이번 달 리포트가 이미 존재합니다.',
        extensions: { code: 'CONFLICT' },
      });
    });
  });

  describe('generateReport — 최소 기록 게이팅', () => {
    beforeEach(() => {
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.report.create.mockResolvedValue({ id: 'report-1', status: ReportStatus.pending });
    });

    it('기록 건수가 부족하면 거부한다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(buildRecords(7, 1)); // 7건, 7일

      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 7)),
      ).rejects.toMatchObject({
        message: '리포트 생성을 위한 기록이 부족합니다. 10건 이상, 7일 이상 기록이 필요합니다.',
        extensions: { code: 'UNPROCESSABLE_ENTITY' },
      });
    });

    it('건수는 충분해도 기록된 날짜가 하루뿐이면 거부한다 (같은 날 중복 기록)', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(buildRecords(1, 10)); // 10건, 1일

      await expect(
        service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 7)),
      ).rejects.toMatchObject({
        extensions: { code: 'UNPROCESSABLE_ENTITY' },
      });
    });

    it('건수와 날짜 수를 모두 만족하면 리포트를 생성한다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);

      const result = await service.generateReport(
        USER_ID,
        PET_ID,
        new Date(2024, 0, 1),
        new Date(2024, 0, 7),
      );

      expect(result).toEqual({ reportId: 'report-1', status: ReportStatus.pending });
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: PET_ID,
          status: ReportStatus.pending,
          generatedBy: ReportGeneratedBy.mock,
        }),
      });
    });
  });

  describe('generateReport — runGeneration 상태 전이 (fire-and-forget)', () => {
    beforeEach(() => {
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.create.mockResolvedValue({ id: 'report-1', status: ReportStatus.pending });
      prisma.report.update.mockResolvedValue({});
    });

    it('생성 성공 시 processing → completed로 전이하고 결과를 저장한다', async () => {
      generator.generate.mockResolvedValue({
        overview: '전반적으로 양호해요',
        highlights: ['체중 안정적'],
        concerns: [],
        recommendations: ['정기 검진 권장'],
      });

      await service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 7));
      await flushPromises();

      expect(prisma.report.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'report-1' },
        data: { status: ReportStatus.processing },
      });
      expect(prisma.report.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'report-1' },
        data: {
          status: ReportStatus.completed,
          overview: '전반적으로 양호해요',
          highlights: ['체중 안정적'],
          concerns: [],
          recommendations: ['정기 검진 권장'],
        },
      });
    });

    it('생성 중 예외가 발생하면 failed로 전이하고 사유를 저장한다', async () => {
      generator.generate.mockRejectedValue(new Error('AI 호출 실패'));

      await service.generateReport(USER_ID, PET_ID, new Date(2024, 0, 1), new Date(2024, 0, 7));
      await flushPromises();

      expect(prisma.report.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'report-1' },
        data: { status: ReportStatus.failed, failedReason: 'AI 호출 실패' },
      });
    });
  });

  describe('getReportStatus', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('이번 달 활성 리포트가 없으면 생성 가능하다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.findFirst.mockResolvedValue(null);

      const result = await service.getReportStatus(USER_ID, PET_ID);

      expect(result.canGenerateThisMonth).toBe(true);
      expect(result.hasEnoughRecords).toBe(true);
      expect(result.nextAvailableAt).toBeUndefined();
      expect(result.processingReport).toBeUndefined();
    });

    it('이번 달 활성 리포트가 있으면 생성 불가하고 다음 가능 시점을 알려준다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.findFirst.mockResolvedValue({
        id: 'existing-report',
        status: ReportStatus.completed,
      });

      const result = await service.getReportStatus(USER_ID, PET_ID);

      expect(result.canGenerateThisMonth).toBe(false);
      expect(result.nextAvailableAt).toBeInstanceOf(Date);
    });

    it('KST 새벽에도 "이번 달"을 KST 달력으로 판정한다 (회귀)', async () => {
      // KST 9/1 02:00 = UTC 8/31 17:00. UTC 달력으로는 아직 8월이라, 이 시각에는
      // 8월 구간을 훑어 이미 쓴 8월 리포트에 막혔다. 반대로 09시를 넘기면 9월로
      // 넘어가면서 같은 날 한 장이 더 나갔다.
      jest.useFakeTimers().setSystemTime(kst('2026-09-01T02:00:00'));
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.findFirst.mockResolvedValue(null);

      await service.getReportStatus(USER_ID, PET_ID);

      const { where } = prisma.report.findFirst.mock.calls[0][0];
      // KST 9/1 00:00 이상 ~ KST 10/1 00:00 미만
      expect(where.createdAt.gte.toISOString()).toBe('2026-08-31T15:00:00.000Z');
      expect(where.createdAt.lt.toISOString()).toBe('2026-09-30T15:00:00.000Z');
    });

    it('활성 리포트가 pending/processing 상태면 processingReport를 채운다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);
      prisma.report.findFirst.mockResolvedValue({
        id: 'existing-report',
        status: ReportStatus.processing,
      });

      const result = await service.getReportStatus(USER_ID, PET_ID);

      expect(result.processingReport).toEqual({
        id: 'existing-report',
        status: ReportStatus.processing,
      });
    });

    it('기록이 부족하면 hasEnoughRecords가 false다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(buildRecords(2, 1));
      prisma.report.findFirst.mockResolvedValue(null);

      const result = await service.getReportStatus(USER_ID, PET_ID);

      expect(result.hasEnoughRecords).toBe(false);
    });
  });

  describe('pollStatus', () => {
    it('processing 상태로 5분을 초과하면 failed로 전환한다', async () => {
      const staleReport = {
        id: 'report-1',
        status: ReportStatus.processing,
        updatedAt: new Date(Date.now() - 6 * 60 * 1000),
      };
      prisma.report.findFirst.mockResolvedValue(staleReport);
      prisma.report.update.mockResolvedValue({
        ...staleReport,
        status: ReportStatus.failed,
        failedReason: 'Processing timed out after 5 minutes.',
      });

      const result = await service.pollStatus(USER_ID, 'report-1');

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: {
          status: ReportStatus.failed,
          failedReason: 'Processing timed out after 5 minutes.',
        },
      });
      expect(result.status).toBe(ReportStatus.failed);
    });

    it('processing 상태가 5분 이내면 그대로 유지한다', async () => {
      const freshReport = {
        id: 'report-1',
        status: ReportStatus.processing,
        updatedAt: new Date(Date.now() - 60 * 1000),
      };
      prisma.report.findFirst.mockResolvedValue(freshReport);

      const result = await service.pollStatus(USER_ID, 'report-1');

      expect(prisma.report.update).not.toHaveBeenCalled();
      expect(result).toBe(freshReport);
    });

    it('completed 상태는 그대로 반환한다', async () => {
      const completedReport = {
        id: 'report-1',
        status: ReportStatus.completed,
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      };
      prisma.report.findFirst.mockResolvedValue(completedReport);

      const result = await service.pollStatus(USER_ID, 'report-1');

      expect(prisma.report.update).not.toHaveBeenCalled();
      expect(result).toBe(completedReport);
    });
  });

  describe('findOne / assertOwnership', () => {
    it('본인 소유가 아니거나 존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.findOne(USER_ID, 'report-1')).rejects.toThrow(NotFoundException);
    });

    it('본인 소유 리포트는 정상 반환한다', async () => {
      const report = { id: 'report-1', status: ReportStatus.completed };
      prisma.report.findFirst.mockResolvedValue(report);

      const result = await service.findOne(USER_ID, 'report-1');
      expect(result).toBe(report);
    });
  });

  describe('getReportPeriodPreview', () => {
    it('종료일이 시작일보다 이전이면 거부한다', async () => {
      await expect(
        service.getReportPeriodPreview(
          USER_ID,
          PET_ID,
          new Date(2024, 0, 10),
          new Date(2024, 0, 1),
        ),
      ).rejects.toMatchObject({
        message: '종료일은 시작일보다 이후여야 합니다.',
        extensions: { code: 'BAD_REQUEST' },
      });
    });

    it('기간 내 기록 수/일수를 집계해 hasEnoughRecords를 계산한다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue(SUFFICIENT_RECORDS);

      const result = await service.getReportPeriodPreview(
        USER_ID,
        PET_ID,
        new Date(2024, 0, 1),
        new Date(2024, 0, 7),
      );

      expect(result).toEqual({ recordCount: 14, recordDays: 7, hasEnoughRecords: true });
    });
  });

  describe('findAll', () => {
    it('완료된 리포트만 최신순으로 조회한다', async () => {
      const completedReports = [{ id: 'r1', status: ReportStatus.completed }];
      prisma.report.findMany.mockResolvedValue(completedReports);

      const result = await service.findAll(USER_ID, PET_ID);

      expect(petService.assertOwnership).toHaveBeenCalledWith(USER_ID, PET_ID);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { petId: PET_ID, status: ReportStatus.completed },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(completedReports);
    });
  });

  describe('cleanupStaleReports', () => {
    const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('5분 이상 갱신 없이 멈춰있는 pending/processing만 failed로 정리한다', async () => {
      prisma.report.updateMany.mockResolvedValue({ count: 2 });

      await service.cleanupStaleReports();

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          status: { in: [ReportStatus.pending, ReportStatus.processing] },
          updatedAt: { lt: new Date(Date.now() - PROCESSING_TIMEOUT_MS) },
        },
        data: {
          status: ReportStatus.failed,
          failedReason: expect.any(String),
        },
      });
    });
  });
});
