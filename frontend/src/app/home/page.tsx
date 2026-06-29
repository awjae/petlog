'use client';

import { useState } from 'react';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { PetSelector } from '@/features/home/components/PetSelector';
import { TodayRecordBanner } from '@/features/home/components/TodayRecordBanner';
import { QuickRecordButtons } from '@/features/home/components/QuickRecordButtons';
import { UpcomingScheduleList } from '@/features/home/components/UpcomingScheduleList';
import { RecentHealthRecordList } from '@/features/home/components/RecentHealthRecordList';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { HomeNoPetContent } from '@/features/home/components/HomeNoPetContent';
import { HomePhase1Content } from '@/features/home/components/HomePhase1Content';
import { HomeAIUnlockBanner } from '@/features/home/components/HomeAIUnlockBanner';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { FAB } from '@/features/shared/components/FAB';
import styles from './page.module.css';

// 데모용 페이즈 강제 설정: null = 자동 감지, 1 = 온보딩, 2 = 습관 형성, 3 = AI 해금
// TODO: 백엔드 totalHealthRecordCount 연동 후 null로 고정
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
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  /* ── 로딩 ── */
  if (loading && !data) {
    return (
      <main className={styles.main} aria-label="홈">
        <div className={styles.skeletonHeader} aria-hidden="true" />
        <HomeSkeleton />
        <BottomNav />
      </main>
    );
  }

  /* ── 에러 ── */
  if (error && !data) {
    return (
      <main className={styles.main} aria-label="홈">
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>기록을 불러오지 못했어요</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해 주세요</p>
          <button className={styles.retryButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  /* ── 반려동물 미등록 ── */
  if (!data || data.pets.length === 0) {
    return (
      <main className={styles.main} aria-label="홈">
        <HomeNoPetContent />
        <BottomNav />
      </main>
    );
  }

  const activePetId = selectedPetId ?? data.pets[0].id;
  const selectedPet = data.pets.find((p) => p.id === activePetId) ?? data.pets[0];

  // recentHealthRecords.length 합산을 totalRecordCount 대리값으로 사용
  // TODO: 백엔드 totalHealthRecordCount 필드 추가 후 대체
  const totalRecentRecords = data.pets.reduce(
    (sum, pet) => sum + pet.recentHealthRecords.length,
    0,
  );
  const phase: DataPhase = resolveDataPhase(totalRecentRecords);

  return (
    <main className={styles.main} aria-label="홈">
      <PetSelector pets={data.pets} selectedPetId={activePetId} onSelect={setSelectedPetId} />

      {phase === 1 ? (
        <HomePhase1Content pet={selectedPet} upcomingSchedules={data.upcomingSchedules} />
      ) : (
        <div className={styles.content}>
          {phase === 3 && <HomeAIUnlockBanner petName={selectedPet.name} />}

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
    </main>
  );
}
