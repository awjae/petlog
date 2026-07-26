'use client';

import Link from 'next/link';
import { AlertCircle, WifiOff } from 'lucide-react';
import { usePublicSharedReport } from '@/features/report/hooks/usePublicSharedReport';
import { useShareViewerIdentity } from '@/features/report/hooks/useShareViewerIdentity';
import { ReportShareMasthead } from '@/features/report/components/ReportShareMasthead';
import { ReportHeadline } from '@/features/report/components/ReportHeadline';
import {
  ReportDetailSection,
  isSectionVisible,
  type ReportSectionType,
} from '@/features/report/components/ReportDetailSection';
import { ReportDetailSkeleton } from '@/features/report/components/ReportSkeleton';
import styles from './page.module.css';
import { AppLogo } from '@/shared/components/AppLogo';

const DETAIL_SECTION_ORDER: ReportSectionType[] = ['highlights', 'concerns', 'recommendations'];

export function SharedReportClient({ shareToken }: { shareToken: string }) {
  const { report, loading, errorKind, refetch } = usePublicSharedReport(shareToken);
  const { isMember, name, loading: viewerLoading } = useShareViewerIdentity();

  const showCaption = !viewerLoading && isMember;
  const viewerCaption = `${name ? `${name}님` : '회원님'}이 공유한 리포트`;

  const ctaReady = !loading && !viewerLoading;
  const ctaHref = isMember ? '/home' : '/register';
  const ctaLabel = isMember ? 'Petlog 앱으로 이동' : '나도 반려동물 건강 기록 시작하기';

  function renderContent() {
    if (loading) {
      return <ReportDetailSkeleton />;
    }

    if (errorKind === 'not-found') {
      return (
        <div className={styles.errorState} role="alert">
          <AlertCircle
            size={40}
            strokeWidth={1.75}
            className={styles.errorIconNeutral}
            aria-hidden="true"
          />
          <p className={styles.errorHeading}>공유가 중단되었거나 존재하지 않는 링크예요</p>
          <Link href="/" className={styles.errorCta}>
            Petlog 알아보기
          </Link>
        </div>
      );
    }

    if (errorKind === 'network') {
      return (
        <div className={styles.errorState} role="alert">
          <WifiOff
            size={40}
            strokeWidth={1.75}
            className={styles.errorIconDanger}
            aria-hidden="true"
          />
          <p className={styles.errorHeading}>리포트를 불러오지 못했어요</p>
          <button type="button" className={styles.retryBtn} onClick={refetch}>
            다시 시도
          </button>
        </div>
      );
    }

    if (!report) return null;

    const hasConcernsField = report.concerns !== undefined;
    const contentByType: Record<ReportSectionType, string[] | null> = {
      highlights: report.highlights,
      concerns: report.concerns ?? null,
      recommendations: report.recommendations,
    };

    const sectionOrders = {} as Record<ReportSectionType, number>;
    let orderCounter = 0;
    DETAIL_SECTION_ORDER.forEach((type) => {
      if (type === 'concerns' && !hasConcernsField) return;
      if (isSectionVisible(type, contentByType[type])) {
        orderCounter += 1;
        sectionOrders[type] = orderCounter;
      }
    });

    const hasAnyDetail =
      report.highlights.length > 0 ||
      report.recommendations.length > 0 ||
      (hasConcernsField && (report.concerns?.length ?? 0) > 0);

    return (
      <div className={styles.content}>
        <ReportShareMasthead
          petName={report.petName}
          periodStart={report.periodStart}
          periodEnd={report.periodEnd}
        />

        <div className={styles.headlineWrap}>
          <ReportHeadline overview={report.overview} hasOtherContent={hasAnyDetail} />
        </div>

        <div className={styles.sections}>
          {DETAIL_SECTION_ORDER.map((type) => {
            if (type === 'concerns' && !hasConcernsField) return null;
            return (
              <ReportDetailSection
                key={type}
                type={type}
                content={contentByType[type]}
                order={sectionOrders[type]}
              />
            );
          })}
        </div>

        <div className={styles.disclaimer}>
          <p className={styles.disclaimerEyebrow}>안내</p>
          <p className={styles.disclaimerText}>
            이 리포트는 건강 기록을 바탕으로 한 참고 정보입니다. 의료적 진단이나 치료를 대체하지
            않습니다. 건강 이상이 의심되면 수의사와 상담하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.main} aria-label="공유된 리포트">
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <AppLogo size={28} priority />
          <span className={styles.brandName}>Petlog</span>
        </Link>
        {showCaption && <p className={styles.viewerCaption}>{viewerCaption}</p>}
      </header>

      {renderContent()}

      <footer className={styles.ctaFooter}>
        {ctaReady ? (
          <Link href={ctaHref} className={styles.ctaBtn}>
            {ctaLabel}
          </Link>
        ) : (
          <span className={styles.ctaPlaceholder} aria-hidden="true" />
        )}
      </footer>
    </main>
  );
}
