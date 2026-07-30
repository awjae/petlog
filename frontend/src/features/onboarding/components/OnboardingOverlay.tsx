'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ONBOARDING_SLIDES } from '../types/onboarding.types';
import { useOnboardingSlides } from '../hooks/useOnboardingSlides';
import { useOnboardingExit } from '../hooks/useOnboardingExit';
import { useOverlayDismiss } from '@/shared/hooks/useOverlayDismiss';
import { useScrollLock } from '../hooks/useScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { OnboardingSlide } from './OnboardingSlide';
import { PageIndicator } from './PageIndicator';
import { PrimaryButton } from './PrimaryButton';
import { OnboardingCloseButton } from './OnboardingCloseButton';
import styles from './OnboardingOverlay.module.css';

const SLIDE_COUNT = ONBOARDING_SLIDES.length;
// 디밍(200ms)이 카드(160ms)보다 긴 쪽이므로, 실제 정리(unmount/라우팅)는 이 시간만큼
// 기다린 뒤에 수행해야 두 애니메이션이 끝까지 재생된다.
const EXIT_ANIMATION_MS = 200;

type Phase = 'entering' | 'visible' | 'exiting';

/**
 * `/home` 마운트 시 즉시(홈 데이터 로딩을 기다리지 않고) 뜨는 이벤트 팝업형 온보딩.
 *
 * 부모(app/home/page.tsx)가 `hasCompletedOnboarding()`이 false일 때만 조건부로
 * 마운트한다. 배경 탭으로는 닫히지 않으며(포인터 이벤트를 오버레이가 흡수),
 * 노출 중에는 배경 스크롤을 잠그고 포커스를 카드 내부로 가둔다.
 */
export function OnboardingOverlay() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const {
    currentIndex,
    isTransitioning,
    goTo,
    next,
    prev,
    trackRef,
    trackStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useOnboardingSlides(SLIDE_COUNT);
  const { closeOnly, completeAndRoute, isResolvingExit } = useOnboardingExit();

  const isLastSlide = currentIndex === SLIDE_COUNT - 1;
  const isMounted = !dismissed;

  useScrollLock(isMounted);
  useFocusTrap(dialogRef, isMounted);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('visible'));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = useCallback(
    (navigateTo: '/pets/new' | null) => {
      setPhase('exiting');
      window.setTimeout(() => {
        setDismissed(true);
        if (navigateTo) router.push(navigateTo);
      }, EXIT_ANIMATION_MS);
    },
    [router],
  );

  const handleClose = useCallback(() => {
    closeOnly();
    dismiss(null);
  }, [closeOnly, dismiss]);

  const handlePrimaryClick = useCallback(() => {
    if (isTransitioning) return;
    if (!isLastSlide) {
      next();
      return;
    }
    completeAndRoute((destination) => {
      dismiss(destination === 'new-pet' ? '/pets/new' : null);
    });
  }, [isTransitioning, isLastSlide, next, completeAndRoute, dismiss]);

  // 백 버튼/Esc: 이전 슬라이드가 있으면 뒤로, 첫 슬라이드면 오버레이를 닫는다.
  // 시트류와 같은 스택을 쓰므로, 온보딩 위에 다른 오버레이가 떠도 위의 것부터 닫힌다.
  useOverlayDismiss(!dismissed, currentIndex > 0 ? prev : handleClose);

  if (dismissed) return null;

  const overlayPhaseClass =
    phase === 'visible' ? styles.overlayVisible : phase === 'exiting' ? styles.overlayExiting : '';
  const cardPhaseClass =
    phase === 'visible'
      ? styles.cardWrapVisible
      : phase === 'exiting'
        ? styles.cardWrapExiting
        : '';

  return (
    <div className={`${styles.overlay} ${overlayPhaseClass}`} role="presentation">
      <div className={`${styles.cardWrap} ${cardPhaseClass}`}>
        <div
          ref={dialogRef}
          className={styles.card}
          role="dialog"
          aria-modal="true"
          aria-label="Petlog 온보딩"
          tabIndex={-1}
        >
          <OnboardingCloseButton onClick={handleClose} />
          <div className={styles.viewport}>
            <div
              ref={trackRef}
              className={styles.track}
              style={trackStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {ONBOARDING_SLIDES.map((slide, index) => (
                <OnboardingSlide
                  key={slide.id}
                  slide={slide}
                  isActive={index === currentIndex}
                  priority={index === 0}
                />
              ))}
            </div>
          </div>

          <div className={styles.indicatorRow}>
            <PageIndicator count={SLIDE_COUNT} currentIndex={currentIndex} onSelect={goTo} />
          </div>

          <div className={styles.buttonRow}>
            <PrimaryButton
              label={isLastSlide ? '시작하기' : '다음'}
              onClick={handlePrimaryClick}
              loading={isLastSlide && isResolvingExit}
              disabled={isTransitioning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
