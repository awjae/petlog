import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import {
  HEALTH_REPORT_GENERATOR,
  type HealthReportGenerationParams,
  type HealthReportGenerator,
} from '../ai/health-report-generator.interface';
import { ReportStatus, Species } from '@prisma/client';
import type { Report as PrismaReport } from '@prisma/client';

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const MIN_RECORD_COUNT = 10;
const MIN_RECORD_DAYS = 7;
const MIN_PERIOD_DAYS = 7;
const MAX_PERIOD_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
    @Inject(HEALTH_REPORT_GENERATOR) private readonly reportGenerator: HealthReportGenerator,
  ) {}

  async getReportStatus(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);

    const { periodStart: monthStart, nextMonthStart } = this.currentMonthBounds();

    const [records, activeReport] = await Promise.all([
      this.prisma.healthRecord.findMany({
        where: { petId, deletedAt: null },
        select: { recordedAt: true },
      }),
      this.prisma.report.findFirst({
        where: {
          petId,
          status: { not: ReportStatus.failed },
          createdAt: { gte: monthStart, lt: nextMonthStart },
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

  // runGeneration()은 fire-and-forget이라 서버 재시작 시 pending/processing에 멈춘
  // 리포트가 남을 수 있다(report.scheduler.ts가 5분마다 호출). "5분 이상 갱신 없음"만
  // 정리 대상으로 삼는 이유: 배포 중에는 신구 태스크가 잠깐 동시에 떠 있을 수 있는데
  // (desiredCount 1이어도 rolling deployment 특성상), 구 태스크가 방금 갱신한 리포트를
  // "재시작했으니 죽은 것"으로 착각해 잘못 실패 처리하면 안 되기 때문이다. pollStatus의
  // 타임아웃과 동일한 기준(PROCESSING_TIMEOUT_MS)을 재사용해 일관성을 유지한다.
  async cleanupStaleReports(): Promise<void> {
    await this.prisma.report.updateMany({
      where: {
        status: { in: [ReportStatus.pending, ReportStatus.processing] },
        updatedAt: { lt: new Date(Date.now() - PROCESSING_TIMEOUT_MS) },
      },
      data: {
        status: ReportStatus.failed,
        failedReason: '처리 시간이 초과됐습니다. 다시 시도해주세요.',
      },
    });
  }

  async generateReport(userId: string, petId: string, periodStart: Date, periodEnd: Date) {
    const pet = await this.petService.assertOwnership(userId, petId);

    this.assertValidPeriod(periodStart, periodEnd, pet.createdAt);

    const { periodStart: monthStart, nextMonthStart } = this.currentMonthBounds();

    const existing = await this.prisma.report.findFirst({
      where: {
        petId,
        status: { not: ReportStatus.failed },
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
    });

    if (existing) {
      throw new GraphQLError('이번 달 리포트가 이미 존재합니다.', {
        extensions: { code: 'CONFLICT' },
      });
    }

    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null, recordedAt: { gte: periodStart, lte: periodEnd } },
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
        status: ReportStatus.pending,
        generatedBy: this.reportGenerator.kind,
        periodStart,
        periodEnd,
      },
    });

    // fire-and-forget 방식이라 서버 재시작 시 이 리포트가 pending/processing에 멈춘 채
    // 남을 수 있다. cleanupStaleReports()가 5분마다 stale 상태를 failed로 정리한다
    // (report.scheduler.ts) — 즉시 처리가 아니라 지연 복구지만, 이 기능의 트래픽
    // 규모(desiredCount: 1)에서는 BullMQ 같은 큐보다 이 편이 합리적이다.
    void this.runGeneration(report.id, {
      petId,
      petName: pet.name,
      species: pet.species as Species,
      breed: pet.breed ?? null,
      birthDate: pet.birthDate ?? null,
      periodStart,
      periodEnd,
      recordCount,
      recordDays,
    });

    return { reportId: report.id, status: report.status };
  }

  private async runGeneration(
    reportId: string,
    params: HealthReportGenerationParams,
  ): Promise<void> {
    try {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.processing },
      });

      const content = await this.reportGenerator.generate(params);

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

  async getReportPeriodPreview(
    userId: string,
    petId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{ recordCount: number; recordDays: number; hasEnoughRecords: boolean }> {
    await this.petService.assertOwnership(userId, petId);

    if (periodEnd < periodStart) {
      throw new GraphQLError('종료일은 시작일보다 이후여야 합니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null, recordedAt: { gte: periodStart, lte: periodEnd } },
      select: { recordedAt: true },
    });

    const recordCount = records.length;
    const distinctDates = new Set(records.map((r) => r.recordedAt.toISOString().slice(0, 10)));
    const recordDays = distinctDates.size;
    const hasEnoughRecords = recordCount >= MIN_RECORD_COUNT && recordDays >= MIN_RECORD_DAYS;

    return { recordCount, recordDays, hasEnoughRecords };
  }

  private async assertOwnership(userId: string, reportId: string): Promise<PrismaReport> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, pet: { userId } },
    });
    if (!report) throw new NotFoundException('리포트를 찾을 수 없습니다.');
    return report;
  }

  // 시간 성분을 버리고 "달력상 그 날"만 남긴다. periodStart/periodEnd/petCreatedAt/오늘을
  // 전부 이 기준으로 비교해야 "선택한 날짜"와 "그 날짜의 특정 시각"을 혼동하지 않는다.
  private toCalendarDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // generateReport 전용 — 사용자가 지정한 분석 기간(7~90일)의 유효성을 검증한다.
  private assertValidPeriod(periodStart: Date, periodEnd: Date, petCreatedAt: Date): void {
    if (periodEnd < periodStart) {
      throw new GraphQLError('종료일은 시작일보다 이후여야 합니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    // 시간 성분과 무관하게 "달력상 며칠"인지(양 끝 포함)로 계산한다.
    // 그렇지 않으면 프론트가 보내는 "day0 00:00 ~ day6 23:59:59"(7일 선택) 같은 값이
    // ms 기준으로는 7일에 살짝 못 미쳐 정확히 최소/최대 일수를 고른 선택이 거부된다.
    const startDay = this.toCalendarDay(periodStart);
    const endDay = this.toCalendarDay(periodEnd);
    const periodDays = Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1;
    if (periodDays < MIN_PERIOD_DAYS || periodDays > MAX_PERIOD_DAYS) {
      throw new GraphQLError(
        `분석 기간은 ${MIN_PERIOD_DAYS}일 이상 ${MAX_PERIOD_DAYS}일 이하로 지정해야 합니다.`,
        { extensions: { code: 'BAD_REQUEST' } },
      );
    }

    // petCreatedAt은 등록 "시각"(예: 오후 3시)을 담고 있어, 등록 당일 00:00을 시작일로
    // 고른 정상적인 선택까지 시각 비교로 거부되지 않도록 날짜 단위로만 비교한다.
    if (startDay < this.toCalendarDay(petCreatedAt)) {
      throw new GraphQLError('시작일은 반려동물 등록일 이후여야 합니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    // periodEnd는 "선택한 종료일의 23:59:59"를 담고 있어, 오늘을 종료일로 고른 정상적인
    // 선택도 현재 시각(예: 오전 10시)보다 항상 미래로 계산되던 버그 — 날짜 단위로만 비교한다.
    if (endDay > this.toCalendarDay(new Date())) {
      throw new GraphQLError('종료일은 오늘보다 미래일 수 없습니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }
  }

  // 리포트 "내용"의 기간이 아니라 "월 1회 생성 제한" 게이팅에만 쓰이는 캘린더 월 경계.
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
