'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { useHealthRecords } from '@/features/health-record/hooks/useHealthRecords';
import { HealthRecordTimeline } from '@/features/health-record/components/HealthRecordTimeline';
import { RecordBottomSheet } from '@/features/health-record/components/RecordBottomSheet';
import { useState } from 'react';
import styles from './page.module.css';

type Props = {
  params: Promise<{ petId: string }>;
};

export default function TimelinePage({ params }: Props) {
  const { petId } = use(params);
  const router = useRouter();
  const { records, loading, error, refetch } = useHealthRecords(petId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <main className={styles.main}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className={styles.title}>건강 기록</h1>
        <div className={styles.headerRight} />
      </header>

      {/* ── 로딩 ── */}
      {loading && !records.length && (
        <div className={styles.loadingState} aria-label="불러오는 중">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      )}

      {/* ── 에러 ── */}
      {error && !records.length && (
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>기록을 불러오지 못했어요</p>
          <button type="button" className={styles.retryButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      )}

      {/* ── 성공 ── */}
      {!loading && !error && <HealthRecordTimeline records={records} />}

      {/* ── 기록 추가 버튼 ── */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setIsSheetOpen(true)}
        aria-label="기록 추가"
      >
        <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
      </button>

      <RecordBottomSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          refetch();
        }}
        petId={petId}
        defaultType="weight"
      />
    </main>
  );
}
