'use client';

import Link from 'next/link';
import { PawPrint, ArrowRight, NotebookPen, BarChart2, Bell } from 'lucide-react';
import styles from './HomeNoPetContent.module.css';

const FEATURE_ITEMS = [
  { Icon: NotebookPen, text: '체중·식사·산책 기록 관리' },
  { Icon: BarChart2, text: 'AI 건강 리포트 분석' },
  { Icon: Bell, text: '접종·투약 일정 알림' },
];

export function HomeNoPetContent() {
  return (
    <div className={styles.content}>
      {/* ── 메인 CTA 카드 ── */}
      <div className={styles.heroCard}>
        <div className={styles.illustrationWrap} aria-hidden="true">
          <div className={styles.illustrationRing}>
            <PawPrint size={52} strokeWidth={1.25} className={styles.illustrationIcon} />
          </div>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>반려동물을 등록해보세요</h1>
          <p className={styles.heroDesc}>
            반려동물 정보를 등록하면
            <br />
            건강 기록과 AI 리포트를 시작할 수 있어요.
          </p>
        </div>

        <Link href="/pets/new" className={styles.ctaBtn}>
          반려동물 등록하기
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      {/* ── 기능 안내 ── */}
      <section className={styles.featureSection} aria-label="등록 후 이용 가능한 기능">
        <h2 className={styles.featureTitle}>등록하면 이런 걸 할 수 있어요</h2>
        <ul className={styles.featureList}>
          {FEATURE_ITEMS.map(({ Icon, text }) => (
            <li key={text} className={styles.featureItem}>
              <div className={styles.featureIconWrap} aria-hidden="true">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <span className={styles.featureText}>{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
