'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight, PenLine } from 'lucide-react';
import styles from './HomeAIUnlockBanner.module.css';

type HomeAIUnlockBannerProps = {
  petId: string;
  petName: string;
  canGenerateThisMonth: boolean;
  hasEnoughRecords: boolean;
};

function getDismissKey(petId: string): string {
  const now = new Date();
  return `petlog_ai_banner_${petId}_${now.getFullYear()}_${now.getMonth() + 1}`;
}

export function HomeAIUnlockBanner({
  petId,
  petName,
  canGenerateThisMonth,
  hasEnoughRecords,
}: HomeAIUnlockBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = getDismissKey(petId);
    if (typeof window !== 'undefined' && localStorage.getItem(key)) {
      setDismissed(true);
    }
  }, [petId]);

  function handleDismiss() {
    const key = getDismissKey(petId);
    localStorage.setItem(key, '1');
    setDismissed(true);
  }

  if (dismissed) return null;

  const isVariantA = canGenerateThisMonth && hasEnoughRecords;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="닫기">
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Sparkles size={28} strokeWidth={1.5} />
        </div>
        <div className={styles.textGroup}>
          {isVariantA ? (
            <>
              <p className={styles.title}>AI 건강 리포트를 생성할 수 있어요</p>
              <p className={styles.desc}>{petName}의 건강 패턴을 AI가 분석해드려요</p>
            </>
          ) : (
            <>
              <p className={styles.title}>기록을 더 쌓으면 AI 분석이 가능해요</p>
              <p className={styles.desc}>10건 이상, 7일 이상 기간 기록이 필요해요</p>
            </>
          )}
        </div>
      </div>

      {isVariantA ? (
        <Link href={`/reports?petId=${petId}`} className={styles.ctaBtn}>
          리포트 생성하기
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/records/new" className={`${styles.ctaBtn} ${styles.ctaBtnOutline}`}>
          <PenLine size={14} strokeWidth={2} aria-hidden="true" />
          기록하러 가기
        </Link>
      )}
    </div>
  );
}
