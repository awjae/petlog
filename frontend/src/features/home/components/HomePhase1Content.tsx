'use client';

import { useState } from 'react';
import { PawPrint, ArrowRight } from 'lucide-react';
import type { Pet, UpcomingSchedule } from '../types/home.types';
import { QuickRecordButtons } from './QuickRecordButtons';
import { UpcomingScheduleList } from './UpcomingScheduleList';
import { RecordBottomSheet } from '@/features/health-record/components/RecordBottomSheet';
import styles from './HomePhase1Content.module.css';

type HomePhase1ContentProps = {
  pet: Pet;
  upcomingSchedules: UpcomingSchedule[];
};

const GUIDE_ITEMS = [
  { icon: '⚖️', label: '체중', desc: '몸무게 변화 추적' },
  { icon: '🍽', label: '식사', desc: '식사량 기록' },
  { icon: '🦮', label: '산책', desc: '활동량 기록' },
  { icon: '📝', label: '메모', desc: '특이사항 기록' },
];

export function HomePhase1Content({ pet, upcomingSchedules }: HomePhase1ContentProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className={styles.content}>
      {/* ── 웰컴 카드 ── */}
      <div className={styles.welcomeCard}>
        <div className={styles.topRow}>
          <span className={styles.welcomeBadge}>첫 기록</span>
        </div>

        <div className={styles.illustrationWrap} aria-hidden="true">
          <div className={styles.illustrationRing}>
            <PawPrint size={52} strokeWidth={1.25} className={styles.illustrationIcon} />
          </div>
        </div>

        <div className={styles.welcomeText}>
          <h2 className={styles.welcomeTitle}>{pet.name}의 기록을 시작해요!</h2>
          <p className={styles.welcomeDesc}>
            체중, 식사, 산책 기록 한 번이면 돼요.
            <br />
            꾸준한 기록이 건강한 습관을 만들어요.
          </p>
        </div>

        <button type="button" className={styles.ctaBtn} onClick={() => setIsSheetOpen(true)}>
          첫 기록 남기기
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <RecordBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        petId={pet.id}
        defaultType="weight"
      />

      {/* ── 기록 유형 안내 ── */}
      <section className={styles.guideSection} aria-label="기록할 수 있는 항목">
        <h2 className={styles.guideTitle}>이런 걸 기록할 수 있어요</h2>
        <div className={styles.guideGrid}>
          {GUIDE_ITEMS.map((item) => (
            <div key={item.label} className={styles.guideItem}>
              <span className={styles.guideItemIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.guideItemLabel}>{item.label}</span>
              <span className={styles.guideItemDesc}>{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 빠른 기록 버튼 ── */}
      <QuickRecordButtons petId={pet.id} />

      {/* ── 다가오는 일정 ── */}
      <UpcomingScheduleList schedules={upcomingSchedules} />
    </div>
  );
}
