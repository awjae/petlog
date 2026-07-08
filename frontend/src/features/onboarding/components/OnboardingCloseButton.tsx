'use client';

import { X } from 'lucide-react';
import styles from './OnboardingCloseButton.module.css';

interface OnboardingCloseButtonProps {
  onClick: () => void;
}

// 슬라이드 이미지(.viewport) 우상단에 얹히는 닫기 버튼 (기존 SkipButton 대체).
// 시각 크기는 28x28px이지만 터치 타겟은 40x40px로 확보한다.
// petCount 조회, 이미지 로드 실패 등 어떤 상태와도 무관하게 항상 즉시 반응해야 하므로
// disabled/loading을 받지 않는다.
export function OnboardingCloseButton({ onClick }: OnboardingCloseButtonProps) {
  return (
    <button type="button" className={styles.hit} onClick={onClick} aria-label="온보딩 닫기">
      <span className={styles.circle}>
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </button>
  );
}
