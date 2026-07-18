import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GraphQLError } from 'graphql';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportService } from './report.service';
import { ReportStatus } from '@prisma/client';
import type { ReportShare as PrismaReportShare } from '@prisma/client';
import type { ReportShareSettings } from './report-share.types';
import type { PublicSharedReport } from './report-share-public.types';

@Injectable()
export class ReportShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
  ) {}

  // 설정 시트를 열 때 기존 공유 설정을 불러온다. 공유한 적이 없으면 기본값(비활성/토큰 없음)을 반환한다.
  async getShareSettings(userId: string, reportId: string): Promise<ReportShareSettings> {
    await this.assertShareableReport(userId, reportId);

    const share = await this.prisma.reportShare.findUnique({ where: { reportId } });
    return this.toSettings(share);
  }

  // 공유 시작 및 재공유(활성화) — upsert로 최초 공유와 재공유를 모두 처리한다.
  // update 절에는 shareToken을 넣지 않는다 — 재공유 시에도 이전에 안내했던 URL이 그대로
  // 유효해야 하므로 토큰을 재발급하지 않는다.
  async startShare(userId: string, reportId: string): Promise<ReportShareSettings> {
    await this.assertShareableReport(userId, reportId);

    const share = await this.prisma.reportShare.upsert({
      where: { reportId },
      create: { reportId, shareToken: this.generateToken(), isActive: true },
      update: { isActive: true },
    });
    return this.toSettings(share);
  }

  // 공유 중지(비활성화). 공유한 적이 없으면(행 없음) 아무것도 하지 않고 기본값을 반환한다
  // — 이미 "중지된" 상태와 동치이므로 존재하지 않는 행을 굳이 만들거나 에러를 낼 이유가 없다.
  async stopShare(userId: string, reportId: string): Promise<ReportShareSettings> {
    await this.assertShareableReport(userId, reportId);

    const existing = await this.prisma.reportShare.findUnique({ where: { reportId } });
    if (!existing) return this.toSettings(null);

    const share = await this.prisma.reportShare.update({
      where: { reportId },
      data: { isActive: false },
    });
    return this.toSettings(share);
  }

  // concerns 포함 여부 토글. 공유를 시작하기 전에도(isActive=false 상태에서도) 미리
  // 설정해둘 수 있어야 하므로 upsert를 쓴다 — 이 경우 새로 생성되는 행은 isActive
  // 기본값(false)을 그대로 둔다(토글만으로 공유가 시작되지 않는다).
  async setIncludeConcerns(
    userId: string,
    reportId: string,
    includeConcerns: boolean,
  ): Promise<ReportShareSettings> {
    await this.assertShareableReport(userId, reportId);

    const share = await this.prisma.reportShare.upsert({
      where: { reportId },
      create: { reportId, shareToken: this.generateToken(), isActive: false, includeConcerns },
      update: { includeConcerns },
    });
    return this.toSettings(share);
  }

  // 공개(비로그인) 조회 — assertOwnership/assertShareableReport를 절대 거치지 않는다.
  // 토큰 미존재와 isActive=false를 동일하게 "없음"(null)으로 응답해 enumeration을 방지한다
  // (PasswordResetToken과 동일 원칙).
  async getPublicReport(shareToken: string): Promise<PublicSharedReport | null> {
    const share = await this.prisma.reportShare.findUnique({
      where: { shareToken },
      include: { report: { include: { pet: { select: { name: true } } } } },
    });

    if (!share || !share.isActive) return null;

    const { report } = share;

    return {
      petName: report.pet.name,
      overview: report.overview,
      highlights: report.highlights,
      ...(share.includeConcerns ? { concerns: report.concerns } : {}),
      recommendations: report.recommendations,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      createdAt: report.createdAt,
    };
  }

  // 소유권 검증(ReportService.assertOwnership) + "완료된 리포트만 공유 가능" 정책을 한 곳에서 강제한다.
  // DB 레벨 CHECK 제약은 Postgres가 다른 테이블(reports.status) 참조를 지원하지 않아 불가능하므로
  // 서비스 레이어에서만 검증한다.
  private async assertShareableReport(userId: string, reportId: string) {
    const report = await this.reportService.assertOwnership(userId, reportId);
    if (report.status !== ReportStatus.completed) {
      throw new GraphQLError('완료된 리포트만 공유할 수 있습니다.', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }
    return report;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private toSettings(share: PrismaReportShare | null): ReportShareSettings {
    return {
      isActive: share?.isActive ?? false,
      includeConcerns: share?.includeConcerns ?? false,
      shareToken: share?.shareToken ?? null,
    };
  }
}
