'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { useSelectedPetStore } from '@/features/pet/stores/selectedPet.store';
import { consumePendingToast } from '@/shared/utils/pendingToast';
import { useReportStatus } from '@/features/report/hooks/useReportStatus';
import { hasCompletedOnboarding } from '@/features/onboarding/utils/onboardingStorage';
import { PetSelector } from '@/features/home/components/PetSelector';
import { TodayRecordBanner } from '@/features/home/components/TodayRecordBanner';
import { QuickRecordButtons } from '@/features/home/components/QuickRecordButtons';
import { UpcomingScheduleList } from '@/features/home/components/UpcomingScheduleList';
import { RecentHealthRecordList } from '@/features/home/components/RecentHealthRecordList';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { HomeNoPetContent } from '@/features/home/components/HomeNoPetContent';
import { HomePhase1Content } from '@/features/home/components/HomePhase1Content';
import { HomeAIUnlockBanner } from '@/features/home/components/HomeAIUnlockBanner';
import { BottomNav } from '@/shared/components/BottomNav';
import { FAB } from '@/shared/components/FAB';
import { useToast, ToastContainer } from '@/shared/components/Toast';
import styles from './page.module.css';

// 온보딩을 이미 완료한 대다수 사용자에게는 전혀 필요 없는 화면이다(hasCompletedOnboarding
// 참고). 슬라이드/제스처/포커스 트랩 로직 전체를 초기 홈 번들에서 분리해, 온보딩이
// 실제로 필요한 신규 사용자에게만 청크를 내려받게 한다.
const OnboardingOverlay = dynamic(
  () =>
    import('@/features/onboarding/components/OnboardingOverlay').then(
      (mod) => mod.OnboardingOverlay,
    ),
  { ssr: false, loading: () => <OnboardingLoadingFallback /> },
);

function OnboardingLoadingFallback() {
  return (
    <div className={styles.onboardingLoading} role="status" aria-label="온보딩을 불러오는 중">
      <LoaderCircle size={28} strokeWidth={2} className={styles.onboardingLoadingSpinner} />
    </div>
  );
}

// 데모용 페이즈 강제 설정: null = 자동 감지, 1 = 온보딩, 2 = 습관 형성, 3 = AI 해금
const DEMO_PHASE: null | 1 | 2 | 3 = null;

type DataPhase = 1 | 2 | 3;

function resolveDataPhase(totalRecords: number): DataPhase {
  if (DEMO_PHASE !== null) return DEMO_PHASE;
  if (totalRecords === 0) return 1;
  if (totalRecords >= 30) return 3;
  return 2;
}

export default function HomePage() {
  const { data, loading, error, refetch } = useHomeData();
  const selectedPetId = useSelectedPetStore((s) => s.selectedPetId);
  const setSelectedPetId = useSelectedPetStore((s) => s.setSelectedPetId);
  const { toasts, addToast, dismiss } = useToast();
  // 홈 데이터 로딩 완료를 기다리지 않고, 마운트 즉시 온보딩 완료 여부만 판단한다.
  // 서버 렌더링에서는 항상 false(미노출)이므로 hydration mismatch가 없다.
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const message = consumePendingToast();
    if (message) addToast(message, 'success');
  }, []);

  useEffect(() => {
    setShowOnboarding(!hasCompletedOnboarding());
  }, []);

  const onboardingOverlay = showOnboarding ? <OnboardingOverlay /> : null;

  function handleSelectPet(petId: string) {
    setSelectedPetId(petId);
  }

  const activePetIdForStatus =
    data?.pets.find((p) => p.id === selectedPetId)?.id ?? data?.pets[0]?.id ?? '';
  const { status: reportStatus } = useReportStatus(activePetIdForStatus);

  // selectedPetId가 없거나 무효해서 첫 번째 pet으로 폴백한 경우, 그 결과를 스토어에도
  // 반영해야 store가 "크로스 라우트 단일 소스" 역할을 계속할 수 있다.
  useEffect(() => {
    if (activePetIdForStatus && activePetIdForStatus !== selectedPetId) {
      setSelectedPetId(activePetIdForStatus);
    }
  }, [activePetIdForStatus, selectedPetId, setSelectedPetId]);

  /* ── 로딩 ── */
  if (loading && !data) {
    return (
      <>
        {onboardingOverlay}
        <main className={styles.main} aria-label="홈">
          <div className={styles.skeletonHeader} aria-hidden="true" />
          <HomeSkeleton />
          <BottomNav />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </main>
      </>
    );
  }

  /* ── 에러 ── */
  if (error && !data) {
    return (
      <>
        {onboardingOverlay}
        <main className={styles.main} aria-label="홈">
          <div className={styles.errorState} role="alert">
            <p className={styles.errorText}>기록을 불러오지 못했어요</p>
            <p className={styles.errorHint}>잠시 후 다시 시도해 주세요</p>
            <button className={styles.retryButton} onClick={() => refetch()}>
              다시 시도
            </button>
          </div>
          <BottomNav />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </main>
      </>
    );
  }

  /* ── 반려동물 미등록 ── */
  if (!data || data.pets.length === 0) {
    return (
      <>
        {onboardingOverlay}
        <main className={styles.main} aria-label="홈">
          <HomeNoPetContent />
          <BottomNav />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </main>
      </>
    );
  }

  const activePetId = data.pets.find((p) => p.id === selectedPetId)?.id ?? data.pets[0].id;
  const selectedPet = data.pets.find((p) => p.id === activePetId) ?? data.pets[0];

  const totalRecordCount = data.pets.reduce((sum, pet) => sum + pet.totalHealthRecordCount, 0);
  const phase: DataPhase = resolveDataPhase(totalRecordCount);

  return (
    <>
      {onboardingOverlay}
      <main className={styles.main} aria-label="홈">
        <PetSelector pets={data.pets} selectedPetId={activePetId} onSelect={handleSelectPet} />

        {phase === 1 ? (
          <HomePhase1Content pet={selectedPet} upcomingSchedules={data.upcomingSchedules} />
        ) : (
          <div className={styles.content}>
            {reportStatus?.canGenerateThisMonth && (
              <HomeAIUnlockBanner
                petId={activePetId}
                petName={selectedPet.name}
                canGenerateThisMonth={reportStatus.canGenerateThisMonth}
                hasEnoughRecords={reportStatus.hasEnoughRecords}
              />
            )}

            <TodayRecordBanner
              count={selectedPet.todayRecordCount}
              petName={selectedPet.name}
              streak={data.streak}
            />

            <QuickRecordButtons petId={activePetId} />

            <UpcomingScheduleList schedules={data.upcomingSchedules} />

            <RecentHealthRecordList petId={activePetId} records={selectedPet.recentHealthRecords} />
          </div>
        )}

        <FAB href="/records/new" label="기록 추가" />
        <BottomNav />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </main>
    </>
  );
}
