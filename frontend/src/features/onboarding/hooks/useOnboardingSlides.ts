'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type CSSProperties,
} from 'react';

const TRANSITION_MS = 240;
// 좌우 엣지 20px 안쪽에서 시작한 터치는 드래그로 인식하지 않는다.
// iOS 시스템 엣지 스와이프(뒤로가기 제스처)와 충돌하지 않도록 하기 위함이다.
const EDGE_DEAD_ZONE_PX = 20;
const COMMIT_DISTANCE_RATIO = 0.3;
const COMMIT_VELOCITY_PX_PER_MS = 0.5;
const RUBBER_BAND_FACTOR = 0.35;

interface UseOnboardingSlidesResult {
  currentIndex: number;
  isTransitioning: boolean;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackStyle: CSSProperties;
  handlePointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: PointerEvent<HTMLDivElement>) => void;
}

export function useOnboardingSlides(slideCount: number): UseOnboardingSlidesResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDeltaPx, setDragDeltaPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerStartX = useRef(0);
  const pointerStartTime = useRef(0);
  const trackWidth = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const ignoringGesture = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockTransitionBriefly = useCallback(() => {
    setIsTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      const clamped = Math.max(0, Math.min(slideCount - 1, index));
      setCurrentIndex(clamped);
      lockTransitionBriefly();
    },
    [isTransitioning, slideCount, lockTransitionBriefly],
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (isTransitioning) {
      ignoringGesture.current = true;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xInTrack = e.clientX - rect.left;
    if (xInTrack < EDGE_DEAD_ZONE_PX || xInTrack > rect.width - EDGE_DEAD_ZONE_PX) {
      // 엣지 근처 시작 — 네이티브 제스처(iOS 뒤로가기 등)에 양보한다.
      ignoringGesture.current = true;
      return;
    }
    ignoringGesture.current = false;
    trackWidth.current = rect.width;
    pointerStartX.current = e.clientX;
    pointerStartTime.current = performance.now();
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (ignoringGesture.current || activePointerId.current !== e.pointerId || !isDragging) return;
    let delta = e.clientX - pointerStartX.current;
    const atStart = currentIndex === 0;
    const atEnd = currentIndex === slideCount - 1;
    if ((atStart && delta > 0) || (atEnd && delta < 0)) {
      delta *= RUBBER_BAND_FACTOR;
    }
    setDragDeltaPx(delta);
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (ignoringGesture.current || activePointerId.current !== e.pointerId) {
      ignoringGesture.current = false;
      activePointerId.current = null;
      return;
    }
    if (!isDragging) return;

    const width = trackWidth.current || 1;
    const elapsedMs = Math.max(1, performance.now() - pointerStartTime.current);
    const velocity = Math.abs(dragDeltaPx) / elapsedMs;
    const distanceRatio = Math.abs(dragDeltaPx) / width;
    const shouldCommit =
      distanceRatio >= COMMIT_DISTANCE_RATIO || velocity >= COMMIT_VELOCITY_PX_PER_MS;

    const draggedDelta = dragDeltaPx;
    setIsDragging(false);
    setDragDeltaPx(0);
    activePointerId.current = null;

    if (shouldCommit && draggedDelta < 0 && currentIndex < slideCount - 1) {
      goTo(currentIndex + 1);
    } else if (shouldCommit && draggedDelta > 0 && currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      // 커밋 조건 미달 또는 경계 — 원위치로 스냅백 (연속 입력만 잠깐 잠근다)
      lockTransitionBriefly();
    }
  }

  const trackStyle: CSSProperties = {
    transform: `translateX(calc(${-currentIndex * 100}% + ${dragDeltaPx}px))`,
    transition: isDragging ? 'none' : `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  };

  return {
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
  };
}
