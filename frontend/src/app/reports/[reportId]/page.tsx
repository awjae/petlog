'use client';

import { use, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronLeft, LoaderCircle, Share2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useReport } from '@/features/report/hooks/useReport';
import { useReportPolling } from '@/features/report/hooks/useReportPolling';
import { useGenerateReport } from '@/features/report/hooks/useGenerateReport';
import {
  ReportDetailSection,
  isSectionVisible,
} from '@/features/report/components/ReportDetailSection';
import { ReportDetailSkeleton } from '@/features/report/components/ReportSkeleton';
import { ReportCover } from '@/features/report/components/ReportCover';
import { ReportHeadline } from '@/features/report/components/ReportHeadline';
import { ReportStatusNotice } from '@/features/report/components/ReportStatusNotice';
import {
  PETS_FOR_REPORT_QUERY,
  REPORT_POLL_STATUS_QUERY,
} from '@/features/report/api/report.queries';
import { categorizeFailureReason, formatPeriodRange } from '@/features/report/utils/reportFormat';
import type { ReportSectionType } from '@/features/report/components/ReportDetailSection';
import styles from './page.module.css';

// 공유 바텀시트는 "공유하기" 버튼을 눌렀을 때만 의미 있는 순수 클라이언트 인터랙션
// 컴포넌트다(터치 드래그, 클립보드, 네이티브 공유 시트, 캔버스 이미지 생성). 리포트
// 상세 진입 시 항상 필요한 코드가 아니므로 초기 번들에서 분리한다.
//
// 중요: 이 컴포넌트는 아래에서 `shareSheetMounted`가 true일 때만 JSX에 등장한다.
// isOpen=false여도 항상 렌더링하면 페이지 마운트 시점에 dynamic loader가 바로
// 실행돼 "공유 안 하면 청크를 안 받는다"는 목적이 무력화되기 때문이다.
const ShareReportSheet = dynamic(
  () => import('@/features/report/components/ShareReportSheet').then((mod) => mod.ShareReportSheet),
  { ssr: false, loading: () => <ShareSheetLoadingFallback /> },
);

function ShareSheetLoadingFallback() {
  return (
    <div className={styles.shareSheetLoading} role="status" aria-label="공유 화면을 불러오는 중">
      <LoaderCircle size={22} strokeWidth={2} className={styles.shareSheetLoadingSpinner} />
    </div>
  );
}

const DETAIL_SECTION_ORDER: ReportSectionType[] = ['highlights', 'concerns', 'recommendations'];

export default function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const { reportId } = use(params);
  const [isShareOpen, setIsShareOpen] = useState(false);
  // 한 번이라도 "공유하기"를 눌렀는지 여부. true가 된 뒤로는 다시 false로
  // 되돌리지 않는다 — isOpen만으로 여닫으면 매번 청크가 다시 필요하진 않지만,
  // ShareReportSheet를 언마운트했다가 재마운트하면 내부 useReportShare 훅이
  // 공유 설정을 다시 조회해야 해서 불필요한 재요청과 깜빡임이 생긴다.
  const [shareSheetMounted, setShareSheetMounted] = useState(false);

  const { report, loading, error, refetch } = useReport(reportId);
  const isInFlight = report?.status === 'pending' || report?.status === 'processing';

  useReportPolling(isInFlight ? reportId : null, () => refetch());

  const { data: pollData } = useQuery(REPORT_POLL_STATUS_QUERY, {
    variables: { id: reportId },
    skip: report?.status !== 'failed',
    fetchPolicy: 'cache-first',
  });
  const failureNotice = categorizeFailureReason(pollData?.reportPollStatus.failedReason);

  const { generateReport, loading: retrying, error: retryError } = useGenerateReport();

  async function handleRetry() {
    if (!report?.petId) return;
    const newReportId = await generateReport(report.petId, report.periodStart, report.periodEnd);
    if (newReportId) {
      router.replace(`/reports/${newReportId}`);
    }
  }

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
        <ReportStatusNotice
          variant="failed"
          heading={failureNotice.heading}
          desc={retryError || failureNotice.desc}
          onBack={() => router.back()}
          onRetry={handleRetry}
          retrying={retrying}
        />
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
        <button
          type="button"
          className={styles.shareBtn}
          onClick={() => {
            setShareSheetMounted(true);
            setIsShareOpen(true);
          }}
        >
          <Share2 size={18} strokeWidth={2} aria-hidden="true" />
          공유하기
        </button>
      </footer>

      {shareSheetMounted && (
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
      )}
    </main>
  );
}
