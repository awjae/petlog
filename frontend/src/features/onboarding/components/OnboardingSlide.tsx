'use client';

import type { OnboardingSlideData } from '../types/onboarding.types';
import { SlideIllustration } from './SlideIllustration';
import styles from './OnboardingSlide.module.css';

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  isActive: boolean;
  priority?: boolean;
}

// UI만 담당 — 슬라이드 전환/드래그 상태는 상위 훅(useOnboardingSlides)이 관리한다.
// 모달 카드 내부에 배치되므로 치수는 카드 기준 고정 px이며, 타이틀/서브카피는
// min-height로 고정해 슬라이드가 바뀌어도 카드 높이가 변하지 않도록 한다.
export function OnboardingSlide({ slide, isActive, priority }: OnboardingSlideProps) {
  return (
    <div className={styles.slide} aria-hidden={!isActive}>
      <SlideIllustration src={slide.imageSrc} priority={priority} />
      <div className={`${styles.textArea} ${isActive ? styles.textActive : ''}`}>
        <h2 className={styles.title}>{slide.title}</h2>
        <p className={styles.subtitle}>{slide.subtitle}</p>
      </div>
    </div>
  );
}
