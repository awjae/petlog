'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { usePetDetail } from '@/features/pet/hooks/usePet';
import { PetProfileSummary } from '@/features/pet/components/PetProfileSummary';
import { PetStatCards } from '@/features/pet/components/PetStatCards';
import { PetWeightTrend } from '@/features/pet/components/PetWeightTrend';
import { toWeightTrend } from '@/features/pet/utils/weightTrend';
import { useHealthRecords } from '@/features/health-record/hooks/useHealthRecords';
import { PetRecentRecords } from '@/features/pet/components/PetRecentRecords';
import { PetQuickLinks } from '@/features/pet/components/PetQuickLinks';
import { PetDetailSkeleton } from '@/features/pet/components/PetDetailSkeleton';
import styles from './page.module.css';

export default function PetDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const { pet, loading, error, notFound, refetch } = usePetDetail(petId);
  // 그래프는 최근 90일 기준이라 개수(limit)로는 자를 수 없다. 체중 기록만 받아 날짜로 거른다.
  const {
    records,
    loading: recordsLoading,
    error: recordsError,
  } = useHealthRecords(petId, { type: 'weight' });

  /* ── 반려동물을 찾을 수 없음 (헤더 없이 중앙 정렬) ── */
  if (notFound) {
    return (
      <main className={styles.centerMain} aria-label="반려동물을 찾을 수 없음">
        <p className={styles.notFoundText}>반려동물을 찾을 수 없어요</p>
        <Link href="/home" className={styles.homeBtn}>
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.main} aria-label="반려동물 상세">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{pet?.name ?? '반려동물'}</h1>
        {pet ? (
          <Link href={`/pets/${petId}/edit`} className={styles.editBtn}>
            수정
          </Link>
        ) : (
          <div className={styles.headerSpacer} aria-hidden="true" />
        )}
      </header>

      {loading && !pet ? (
        <PetDetailSkeleton />
      ) : error && !pet ? (
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>기록을 불러오지 못했어요</p>
          <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      ) : pet ? (
        <>
          <PetProfileSummary pet={pet} />
          <PetStatCards recentWeight={pet.recentWeight} todayRecordCount={pet.todayRecordCount} />
          {!(recordsLoading && records.length === 0) && (
            <PetWeightTrend
              trend={toWeightTrend(records)}
              error={recordsError != null && records.length === 0}
            />
          )}
          <PetRecentRecords petId={petId} records={pet.recentHealthRecords} />
          <PetQuickLinks petId={petId} />
        </>
      ) : null}

      {pet && (
        <div className={styles.footer}>
          <Link href={`/records/new?petId=${petId}`} className={styles.ctaBtn}>
            건강 기록 추가
          </Link>
        </div>
      )}
    </main>
  );
}
