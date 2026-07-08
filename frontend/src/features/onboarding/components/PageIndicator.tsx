'use client';

import styles from './PageIndicator.module.css';

interface PageIndicatorProps {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

// 탭한 도트로 직접 이동한다 (중간 슬라이드 경유 없음). 히트 영역은 32x32px로
// 도트 자체(6x6 / 20x6)보다 넓게 잡아 터치 타겟 최소 44px 기준에 최대한 근접시킨다.
export function PageIndicator({ count, currentIndex, onSelect }: PageIndicatorProps) {
  return (
    <div className={styles.wrap} role="tablist" aria-label="온보딩 진행 상태">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            className={styles.hit}
            onClick={() => onSelect(index)}
            aria-current={isActive}
            aria-label={`${index + 1}번째 화면으로 이동`}
          >
            <span className={isActive ? styles.dotActive : styles.dot} />
          </button>
        );
      })}
    </div>
  );
}
