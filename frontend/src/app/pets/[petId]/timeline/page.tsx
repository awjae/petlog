'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileDown } from 'lucide-react';
import { useHealthRecords } from '@/features/health-record/hooks/useHealthRecords';
import { useDeleteHealthRecord } from '@/features/health-record/hooks/useDeleteHealthRecord';
import { TYPE_LABEL, buildSummary } from '@/features/health-record/types/health-record.types';
import type { HealthRecord } from '@/features/health-record/types/health-record.types';
import { HealthRecordTimeline } from '@/features/health-record/components/HealthRecordTimeline';
import { RecordBottomSheet } from '@/features/health-record/components/RecordBottomSheet';
import { FAB } from '@/shared/components/FAB';
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
  const { deleteHealthRecord } = useDeleteHealthRecord();

  // 되돌릴 수 없는 동작이라 무엇을 지우는지 보여주고 한 번 더 묻는다. Android 앱(Capacitor)도
  // window.confirm을 네이티브 대화상자로 띄운다(BridgeWebChromeClient.onJsConfirm).
  async function handleDelete(record: HealthRecord) {
    const summary = buildSummary(record.type, record.numValue, record.textValue);
    if (!window.confirm(`${TYPE_LABEL[record.type]} 기록(${summary})을 삭제할까요?`)) return;
    const ok = await deleteHealthRecord(record.id);
    if (!ok) window.alert('삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
  }

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
        <div className={styles.headerRight}>
          <Link
            href={`/pets/${petId}/export`}
            className={styles.exportButton}
            aria-label="기록 내보내기"
          >
            <FileDown size={20} strokeWidth={2} />
          </Link>
        </div>
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
      {!loading && !error && <HealthRecordTimeline records={records} onDelete={handleDelete} />}

      {/* ── 기록 추가 버튼 ── */}
      <FAB onClick={() => setIsSheetOpen(true)} label="기록 추가" />

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
