'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { HeartPulse, Lock, Sparkles, CheckCircle, LoaderCircle } from 'lucide-react';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { ToastContainer, useToast } from '@/features/shared/components/Toast';
import { ReportListItem } from '@/features/report/components/ReportListItem';
import { useReportStatus } from '@/features/report/hooks/useReportStatus';
import { useReports } from '@/features/report/hooks/useReports';
import { useGenerateReport } from '@/features/report/hooks/useGenerateReport';
import { useReportPolling } from '@/features/report/hooks/useReportPolling';
import { PETS_FOR_REPORT_QUERY } from '@/features/report/api/report.queries';
import type { PetBasic } from '@/features/report/types/report.types';
import styles from './page.module.css';

const MIN_RECORDS = 10;
const MIN_DAYS = 7;

function PetTabs({
  pets,
  selectedPetId,
  onSelect,
}: {
  pets: PetBasic[];
  selectedPetId: string;
  onSelect: (id: string) => void;
}) {
  if (pets.length <= 1) return null;
  return (
    <div className={styles.petTabs} role="tablist" aria-label="반려동물 선택">
      {pets.map((pet) => (
        <button
          key={pet.id}
          type="button"
          role="tab"
          aria-selected={pet.id === selectedPetId}
          className={`${styles.petTab} ${pet.id === selectedPetId ? styles.petTabActive : ''}`}
          onClick={() => onSelect(pet.id)}
        >
          {pet.name}
        </button>
      ))}
    </div>
  );
}

function BlurPreviewCard() {
  return (
    <div className={styles.previewCard} aria-hidden="true">
      <p className={styles.previewLabel}>리포트 미리보기</p>
      <div className={styles.previewRow}>
        <div className={styles.previewBar} style={{ width: '70%' }} />
        <div className={styles.previewBar} style={{ width: '45%' }} />
        <div className={styles.previewBar} style={{ width: '85%' }} />
      </div>
      <p className={styles.previewBlur}>기록이 충분히 쌓이면 열려요</p>
      <div className={styles.previewOverlay} />
    </div>
  );
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toasts, addToast, dismiss } = useToast();
  const [pollingReportId, setPollingReportId] = useState<string | null>(null);

  const { data: petsData, loading: petsLoading } = useQuery(PETS_FOR_REPORT_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const pets: PetBasic[] = petsData?.me?.pets ?? [];
  const firstPetId = pets[0]?.id ?? '';
  const petIdFromUrl = searchParams.get('petId') ?? '';
  const activePetId = petIdFromUrl || firstPetId;

  function handleSelectPet(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('petId', id);
    router.replace(`/reports?${params.toString()}`);
  }

  const { status, loading: statusLoading, refetch: refetchStatus } = useReportStatus(activePetId);
  const { reports, loading: reportsLoading, refetch: refetchReports } = useReports(activePetId);
  const { generateReport, loading: generating } = useGenerateReport();

  const handlePollingComplete = useCallback(
    (result: 'completed' | 'failed') => {
      setPollingReportId(null);
      if (result === 'completed') {
        addToast('리포트가 완성됐어요', 'success');
        refetchReports();
        refetchStatus();
      } else {
        addToast('리포트 생성에 실패했어요. 다시 시도해주세요.', 'error');
        refetchStatus();
      }
    },
    [addToast, refetchReports, refetchStatus],
  );

  useReportPolling(pollingReportId, handlePollingComplete);

  async function handleGenerate() {
    if (!activePetId) return;
    const reportId = await generateReport(activePetId, 'monthly');
    if (reportId) {
      setPollingReportId(reportId);
      refetchStatus();
    }
  }

  const isInitialLoading = (petsLoading || statusLoading) && !status;
  const isPolling = !!pollingReportId || !!status?.processingReport;

  function formatNextAvailable(iso: string | null | undefined) {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  const recordProgress = Math.min(((status?.recordCount ?? 0) / MIN_RECORDS) * 100, 100);
  const daysProgress = Math.min(((status?.recordDays ?? 0) / MIN_DAYS) * 100, 100);

  const content = () => {
    if (isInitialLoading || !status) {
      return (
        <div className={styles.lockedState}>
          <div className={styles.iconWrap}>
            <HeartPulse size={64} strokeWidth={1.25} className={styles.bigIcon} />
            <span className={styles.lockBadge}>
              <Lock size={18} strokeWidth={2} />
            </span>
          </div>
          <h2 className={styles.heading}>AI 건강 리포트</h2>
          <p className={styles.desc}>
            {isInitialLoading
              ? '불러오는 중이에요...'
              : '기록이 쌓이면 AI가 건강 변화를 분석해드려요.'}
          </p>
        </div>
      );
    }

    if (isPolling) {
      return (
        <div className={styles.lockedState}>
          <div className={styles.iconWrap}>
            <LoaderCircle
              size={64}
              strokeWidth={1.25}
              className={`${styles.bigIcon} ${styles.spinner}`}
            />
          </div>
          <h2 className={styles.heading}>AI 건강 리포트</h2>
          <p className={styles.desc}>
            리포트를 분석 중이에요...
            <br />
            잠시만 기다려 주세요.
          </p>
          <BlurPreviewCard />
        </div>
      );
    }

    if (!status?.canGenerateThisMonth) {
      const nextDate = formatNextAvailable(status?.nextAvailableAt);
      return (
        <>
          <div className={styles.lockedState}>
            <div className={styles.iconWrap}>
              <CheckCircle
                size={64}
                strokeWidth={1.25}
                className={`${styles.bigIcon} ${styles.successIcon}`}
              />
            </div>
            <h2 className={styles.heading}>AI 건강 리포트</h2>
            <p className={styles.desc}>
              이번 달 리포트를 이미 생성했어요.
              {nextDate && (
                <>
                  <br />
                  다음 리포트는 {nextDate}부터예요.
                </>
              )}
            </p>
          </div>
          {!reportsLoading && reports.length > 0 && (
            <section className={styles.listSection} aria-label="지난 리포트">
              <h2 className={styles.listTitle}>지난 리포트</h2>
              <div className={styles.list}>
                {reports.map((report) => (
                  <ReportListItem key={report.id} report={report} />
                ))}
              </div>
            </section>
          )}
        </>
      );
    }

    if (!status.hasEnoughRecords) {
      const remaining = Math.max(0, MIN_RECORDS - (status.recordCount ?? 0));
      const remainingDays = Math.max(0, MIN_DAYS - (status.recordDays ?? 0));
      return (
        <div className={styles.lockedState}>
          <div className={styles.iconWrap} aria-hidden="true">
            <HeartPulse size={64} strokeWidth={1.25} className={styles.bigIcon} />
            <span className={styles.lockBadge}>
              <Lock size={18} strokeWidth={2} />
            </span>
          </div>
          <h2 className={styles.heading}>AI 건강 리포트</h2>
          <p className={styles.desc}>
            기록이 쌓이면 AI가 건강 변화를 분석해드려요.
            <br />
            패턴, 이상 징후, 맞춤 관리 팁을 알 수 있어요.
          </p>
          <div
            className={styles.progressWrap}
            aria-label={`기록 수: ${status.recordCount} / ${MIN_RECORDS}건`}
          >
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>기록 수</span>
              <span className={styles.progressCount}>
                <strong>{status.recordCount}</strong> / {MIN_RECORDS}건
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={status.recordCount}
              aria-valuemax={MIN_RECORDS}
            >
              <div className={styles.progressFill} style={{ width: `${recordProgress}%` }} />
            </div>
          </div>
          <div
            className={styles.progressWrap}
            aria-label={`기록 기간: ${status.recordDays} / ${MIN_DAYS}일`}
          >
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>기록 기간</span>
              <span className={styles.progressCount}>
                <strong>{status.recordDays}</strong> / {MIN_DAYS}일
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={status.recordDays}
              aria-valuemax={MIN_DAYS}
            >
              <div className={styles.progressFill} style={{ width: `${daysProgress}%` }} />
            </div>
          </div>
          <p className={styles.progressHint}>
            {remaining > 0 && `${remaining}건`}
            {remaining > 0 && remainingDays > 0 && ' · '}
            {remainingDays > 0 && `${remainingDays}일`}
            {' 더 기록하면 첫 번째 리포트를 받을 수 있어요'}
          </p>
          <Link href="/records/new" className={styles.ctaButton}>
            지금 기록하러 가기
          </Link>
          <BlurPreviewCard />
        </div>
      );
    }

    return (
      <>
        <div className={styles.lockedState}>
          <div className={styles.iconWrap} aria-hidden="true">
            <HeartPulse size={64} strokeWidth={1.25} className={styles.bigIcon} />
            <span className={styles.sparkBadge}>
              <Sparkles size={16} strokeWidth={2} />
            </span>
          </div>
          <h2 className={styles.heading}>AI 건강 리포트</h2>
          <p className={styles.desc}>
            이번 달 1회 무료 리포트를 생성할 수 있어요.
            <br />
            AI가 기록을 분석해 건강 변화를 알려드려요.
          </p>
          <button
            type="button"
            className={`${styles.ctaButton} ${styles.ctaButtonPrimary} ${generating ? styles.ctaButtonLoading : ''}`}
            onClick={handleGenerate}
            disabled={generating}
            aria-busy={generating}
          >
            {generating ? (
              <>
                <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" /> 분석 중...
              </>
            ) : (
              <>
                <Sparkles size={18} aria-hidden="true" /> AI 리포트 생성하기
              </>
            )}
          </button>
          <BlurPreviewCard />
        </div>
        {!reportsLoading && reports.length > 0 && (
          <section className={styles.listSection} aria-label="지난 리포트">
            <h2 className={styles.listTitle}>지난 리포트</h2>
            <div className={styles.list}>
              {reports.map((report) => (
                <ReportListItem key={report.id} report={report} />
              ))}
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <main className={styles.main} aria-label="리포트">
      <header className={styles.header}>
        <h1 className={styles.title}>리포트</h1>
      </header>
      <PetTabs pets={pets} selectedPetId={activePetId} onSelect={handleSelectPet} />
      {content()}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <BottomNav />
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100dvh', background: 'var(--color-bg)' }} aria-label="리포트" />
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
