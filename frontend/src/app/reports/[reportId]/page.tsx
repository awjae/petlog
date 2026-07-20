'use client';

import { use, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Share2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useReport } from '@/features/report/hooks/useReport';
import {
  ReportDetailSection,
  isSectionVisible,
} from '@/features/report/components/ReportDetailSection';
import { ReportDetailSkeleton } from '@/features/report/components/ReportSkeleton';
import { ReportCover } from '@/features/report/components/ReportCover';
import { ReportHeadline } from '@/features/report/components/ReportHeadline';
import { ReportStatusNotice } from '@/features/report/components/ReportStatusNotice';
import { ShareReportSheet } from '@/features/report/components/ShareReportSheet';
import { PETS_FOR_REPORT_QUERY } from '@/features/report/api/report.queries';
import { formatPeriodRange } from '@/features/report/utils/reportFormat';
import type { ReportSectionType } from '@/features/report/components/ReportDetailSection';
import styles from './page.module.css';

const DETAIL_SECTION_ORDER: ReportSectionType[] = ['highlights', 'concerns', 'recommendations'];

export default function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const { reportId } = use(params);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { report, loading, error } = useReport(reportId);

  const { data: petsData } = useQuery(PETS_FOR_REPORT_QUERY, {
    fetchPolicy: 'cache-first',
  });
  const pets = petsData?.me?.pets ?? [];
  const petName = pets.find((p) => p.id === report?.petId)?.name ?? '';

  function renderHeader(subtitle?: string): ReactNode {
    return (
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>리포트</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>
    );
  }

  if (loading) {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        {renderHeader()}
        <ReportDetailSkeleton />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        {renderHeader()}
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>리포트를 불러올 수 없어요</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요</p>
          <button className={styles.retryBtn} onClick={() => router.back()}>
            돌아가기
          </button>
        </div>
      </main>
    );
  }

  const subtitle = [petName, formatPeriodRange(report.periodStart, report.periodEnd)]
    .filter(Boolean)
    .join(' · ');

  if (report.status === 'processing' || report.status === 'pending') {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        {renderHeader(subtitle)}
        <ReportStatusNotice variant="processing" onBack={() => router.back()} />
      </main>
    );
  }

  if (report.status === 'failed') {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        {renderHeader(subtitle)}
        <ReportStatusNotice variant="failed" onBack={() => router.back()} />
      </main>
    );
  }

  const contentByType: Record<ReportSectionType, string[] | null> = {
    highlights: report.highlights,
    concerns: report.concerns,
    recommendations: report.recommendations,
  };

  const sectionOrders = {} as Record<ReportSectionType, number>;
  let orderCounter = 0;
  DETAIL_SECTION_ORDER.forEach((type) => {
    if (isSectionVisible(type, contentByType[type])) {
      orderCounter += 1;
      sectionOrders[type] = orderCounter;
    }
  });

  const hasAnyDetail =
    (Array.isArray(report.highlights) && report.highlights.length > 0) ||
    (Array.isArray(report.concerns) && report.concerns.length > 0) ||
    (Array.isArray(report.recommendations) && report.recommendations.length > 0);

  return (
    <main className={styles.main} aria-label="리포트 상세">
      {renderHeader(subtitle)}

      <div className={styles.content}>
        <ReportCover
          generatedBy={report.generatedBy}
          periodStart={report.periodStart}
          periodEnd={report.periodEnd}
          petName={petName}
          createdAt={report.createdAt}
        />

        <div className={styles.headlineWrap}>
          <ReportHeadline overview={report.overview} hasOtherContent={hasAnyDetail} />
        </div>

        <div className={styles.sections}>
          {DETAIL_SECTION_ORDER.map((type) => (
            <ReportDetailSection
              key={type}
              type={type}
              content={contentByType[type]}
              order={sectionOrders[type]}
            />
          ))}
        </div>

        <div className={styles.disclaimer}>
          <p className={styles.disclaimerEyebrow}>안내</p>
          <p className={styles.disclaimerText}>
            이 리포트는 건강 기록을 바탕으로 한 참고 정보입니다. 의료적 진단이나 치료를 대체하지
            않습니다. 건강 이상이 의심되면 수의사와 상담하세요.
          </p>
        </div>
      </div>

      <footer className={styles.shareFooter}>
        <button type="button" className={styles.shareBtn} onClick={() => setIsShareOpen(true)}>
          <Share2 size={18} strokeWidth={2} aria-hidden="true" />
          공유하기
        </button>
      </footer>

      <ShareReportSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reportId={report.id}
        petName={petName}
        periodStart={report.periodStart}
        periodEnd={report.periodEnd}
        overview={report.overview}
        highlights={report.highlights}
        concerns={report.concerns}
        recommendations={report.recommendations}
      />
    </main>
  );
}
