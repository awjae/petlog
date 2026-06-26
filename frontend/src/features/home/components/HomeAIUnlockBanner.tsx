'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import styles from './HomeAIUnlockBanner.module.css';

type HomeAIUnlockBannerProps = {
  petName: string;
};

export function HomeAIUnlockBanner({ petName }: HomeAIUnlockBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <button className={styles.dismissBtn} onClick={() => setDismissed(true)} aria-label="닫기">
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Sparkles size={28} strokeWidth={1.5} />
        </div>
        <div className={styles.textGroup}>
          <p className={styles.title}>AI 건강 리포트 해금!</p>
          <p className={styles.desc}>드디어 {petName}의 건강 패턴을 분석할 수 있어요</p>
        </div>
      </div>

      <Link href="/reports" className={styles.ctaBtn}>
        리포트 보기
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}
