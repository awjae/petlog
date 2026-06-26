'use client';

import Link from 'next/link';
import { BarChart2, Lock } from 'lucide-react';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { BottomNav } from '@/features/shared/components/BottomNav';
import styles from './page.module.css';

const REPORT_TARGET = 30;

export default function ReportsPage() {
  const { data, loading } = useHomeData();

  // 전체 반려동물의 최근 기록 수 합산 (임시: 실제 total count API 없음)
  const mockTotalCount = data
    ? data.pets.reduce((sum, pet) => sum + pet.recentHealthRecords.length, 0)
    : 0;
  const progress = Math.min((mockTotalCount / REPORT_TARGET) * 100, 100);
  const isUnlocked = mockTotalCount >= REPORT_TARGET;

  return (
    <main className={styles.main} aria-label="리포트">
      <header className={styles.header}>
        <h1 className={styles.title}>리포트</h1>
      </header>

      {!loading && !isUnlocked && (
        <div className={styles.lockedState}>
          <div className={styles.iconWrap} aria-hidden="true">
            <BarChart2 size={64} strokeWidth={1.25} className={styles.bigIcon} />
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
            aria-label={`진행도: ${mockTotalCount} / ${REPORT_TARGET}건`}
          >
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>기록 쌓기</span>
              <span className={styles.progressCount}>
                <strong>{mockTotalCount}</strong> / {REPORT_TARGET}건
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={mockTotalCount}
              aria-valuemax={REPORT_TARGET}
            >
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressHint}>
              {REPORT_TARGET - mockTotalCount}건 더 기록하면 첫 번째 리포트를 받을 수 있어요
            </p>
          </div>

          <Link href="/records/new" className={styles.ctaButton}>
            지금 기록하러 가기
          </Link>

          <div className={styles.previewCard} aria-hidden="true">
            <p className={styles.previewLabel}>리포트 미리보기</p>
            <div className={styles.previewRow}>
              <div className={styles.previewBar} style={{ width: '70%' }} />
              <div className={styles.previewBar} style={{ width: '45%' }} />
              <div className={styles.previewBar} style={{ width: '85%' }} />
            </div>
            <p className={styles.previewBlur}>이 영역은 기록이 충분히 쌓이면 열려요</p>
            <div className={styles.previewOverlay} />
          </div>
        </div>
      )}

      {!loading && isUnlocked && (
        <div className={styles.unlockedState}>
          <p className={styles.comingSoon}>AI 리포트 생성 중...</p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
