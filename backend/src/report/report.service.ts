import { Injectable, NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { MockReportGenerator } from './mock-report.generator';
import { ReportType, ReportStatus, ReportGeneratedBy, Species } from '@prisma/client';
import type { Report as PrismaReport } from '@prisma/client';

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const MIN_RECORD_COUNT = 10;
const MIN_RECORD_DAYS = 7;

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
    private readonly mockReportGenerator: MockReportGenerator,
  ) {}

  async getReportStatus(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);

    const { periodStart, nextMonthStart } = this.currentMonthBounds();

    const [records, activeReport] = await Promise.all([
      this.prisma.healthRecord.findMany({
        where: { petId, deletedAt: null },
        select: { recordedAt: true },
      }),
      this.prisma.report.findFirst({
        where: {
          petId,
          type: ReportType.monthly,
          status: { not: ReportStatus.failed },
          periodStart: { gte: periodStart, lt: nextMonthStart },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const recordCount = records.length;
    const distinctDates = new Set(records.map((r) => r.recordedAt.toISOString().slice(0, 10)));
    const recordDays = distinctDates.size;

    const canGenerateThisMonth = !activeReport;
    const hasEnoughRecords = recordCount >= MIN_RECORD_COUNT && recordDays >= MIN_RECORD_DAYS;

    const nextAvailableAt = !canGenerateThisMonth ? nextMonthStart : undefined;

    let processingReport: { id: string; status: ReportStatus } | undefined;

    if (
      activeReport &&
      (activeReport.status === ReportStatus.pending ||
        activeReport.status === ReportStatus.processing)
    ) {
      processingReport = { id: activeReport.id, status: activeReport.status };
    }

    return {
      canGenerateThisMonth,
      hasEnoughRecords,
      recordCount,
      recordDays,
      nextAvailableAt,
      processingReport,
    };
  }

  async findAll(userId: string, petId: string): Promise<PrismaReport[]> {
    await this.petService.assertOwnership(userId, petId);
    return this.prisma.report.findMany({
      where: { petId, status: ReportStatus.completed },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<PrismaReport> {
    return this.assertOwnership(userId, id);
  }

  async pollStatus(userId: string, id: string): Promise<PrismaReport> {
    let report = await this.assertOwnership(userId, id);

    if (
      report.status === ReportStatus.processing &&
      Date.now() - report.updatedAt.getTime() > PROCESSING_TIMEOUT_MS
    ) {
      report = await this.prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.failed,
          failedReason: 'Processing timed out after 5 minutes.',
        },
      });
    }

    return report;
  }

  async generateReport(userId: string, petId: string, type: ReportType) {
    if (type !== ReportType.monthly) {
      throw new GraphQLError('현재는 월간 리포트만 지원합니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    const pet = await this.petService.assertOwnership(userId, petId);

    const { periodStart, periodEnd, nextMonthStart } = this.currentMonthBounds();

    const existing = await this.prisma.report.findFirst({
      where: {
        petId,
        type,
        status: { not: ReportStatus.failed },
        periodStart: { gte: periodStart, lt: nextMonthStart },
      },
    });

    if (existing) {
      throw new GraphQLError('이번 달 리포트가 이미 존재합니다.', {
        extensions: { code: 'CONFLICT' },
      });
    }

    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null },
      select: { recordedAt: true },
    });

    const recordCount = records.length;
    const distinctDates = new Set(records.map((r) => r.recordedAt.toISOString().slice(0, 10)));
    const recordDays = distinctDates.size;

    if (recordCount < MIN_RECORD_COUNT || recordDays < MIN_RECORD_DAYS) {
      throw new GraphQLError(
        `리포트 생성을 위한 기록이 부족합니다. ${MIN_RECORD_COUNT}건 이상, ${MIN_RECORD_DAYS}일 이상 기록이 필요합니다.`,
        { extensions: { code: 'UNPROCESSABLE_ENTITY' } },
      );
    }

    const report = await this.prisma.report.create({
      data: {
        petId,
        type,
        status: ReportStatus.pending,
        generatedBy: ReportGeneratedBy.mock,
        periodStart,
        periodEnd,
      },
    });

    void this.runMockGeneration(report.id, {
      petName: pet.name,
      species: pet.species as Species,
      breed: pet.breed ?? null,
      birthDate: pet.birthDate ?? null,
      recordCount,
      recordDays,
    });

    return { reportId: report.id, status: report.status };
  }

  private async runMockGeneration(
    reportId: string,
    params: {
      petName: string;
      species: Species;
      breed: string | null;
      birthDate: Date | null;
      recordCount: number;
      recordDays: number;
    },
  ): Promise<void> {
    try {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.processing },
      });

      const content = await this.mockReportGenerator.generate(params);

      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.completed,
          overview: content.overview,
          highlights: content.highlights,
          concerns: content.concerns,
          recommendations: content.recommendations,
        },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error during generation';
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.failed, failedReason: reason },
      });
    }
  }

  private async assertOwnership(userId: string, reportId: string): Promise<PrismaReport> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, pet: { userId } },
    });
    if (!report) throw new NotFoundException('리포트를 찾을 수 없습니다.');
    return report;
  }

  private currentMonthBounds(): {
    periodStart: Date;
    periodEnd: Date;
    nextMonthStart: Date;
  } {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const periodEnd = new Date(nextMonthStart.getTime() - 1);
    return { periodStart, periodEnd, nextMonthStart };
  }
}
