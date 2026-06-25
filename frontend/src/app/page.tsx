'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { PetSelector } from '@/features/home/components/PetSelector';
import { PetSummaryCard } from '@/features/home/components/PetSummaryCard';
import { TodayRecordBanner } from '@/features/home/components/TodayRecordBanner';
import { UpcomingScheduleList } from '@/features/home/components/UpcomingScheduleList';
import { RecentHealthRecordList } from '@/features/home/components/RecentHealthRecordList';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { FAB } from '@/features/shared/components/FAB';
import styles from './page.module.css';

export default function HomePage() {
  const { data, loading, isUnauthenticated, error, refetch } = useHomeData();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  if (loading && !data) {
    return (
      <main className={styles.main} aria-label="홈">
        <HomeSkeleton />
        <BottomNav />
      </main>
    );
  }

  if (isUnauthenticated) {
    return (
      <main className={styles.landing} aria-label="Petlog 소개">
        <span className={styles.landingIcon} aria-hidden="true">
          🐾
        </span>
        <h1 className={styles.landingTitle}>반려동물 건강 기록</h1>
        <p className={styles.landingDesc}>
          체중, 식욕, 활동량을 간편하게 기록하고 AI 리포트로 건강 변화를 파악해보세요.
        </p>
        <Link href="/register" className={styles.landingCta}>
          무료로 시작하기
        </Link>
        <Link href="/login" className={styles.landingLogin}>
          이미 계정이 있어요 <span>로그인</span>
        </Link>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className={styles.main} aria-label="홈">
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>데이터를 불러오지 못했어요</p>
          <button className={styles.retryButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!data || data.pets.length === 0) {
    return (
      <main className={styles.main} aria-label="홈">
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            🐾
          </span>
          <h1 className={styles.emptyTitle}>반려동물을 등록해보세요</h1>
          <p className={styles.emptyDesc}>건강 기록을 시작하려면 반려동물 정보가 필요해요</p>
          <Link href="/pets/new" className={styles.emptyButton}>
            반려동물 등록하기
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  const currentPetId = selectedPetId ?? data.pets[0].id;
  const currentPet = data.pets.find((p) => p.id === currentPetId) ?? data.pets[0];

  return (
    <main className={styles.main} aria-label="홈">
      <PetSelector pets={data.pets} selectedPetId={currentPetId} onSelect={setSelectedPetId} />

      <div className={styles.content}>
        <PetSummaryCard pet={currentPet} />
        <TodayRecordBanner count={currentPet.todayRecordCount} />
        <UpcomingScheduleList schedules={data.upcomingSchedules} />
        <RecentHealthRecordList petId={currentPet.id} records={currentPet.recentHealthRecords} />
      </div>

      <FAB href={`/pets/${currentPet.id}/records/new`} label="건강 기록 추가" />
      <BottomNav />
    </main>
  );
}
