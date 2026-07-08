'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePetIds } from '@/features/pet/hooks/usePet';
import { markOnboardingCompleted } from '../utils/onboardingStorage';

// petCount 조회가 비정상적으로 오래 걸리는 경우(네트워크 장애 등)
// "시작하기" 처리를 무한정 붙잡아두지 않고 기본 목적지로 안전하게 진행하기 위한 타임아웃.
const EXIT_ROUTE_TIMEOUT_MS = 4000;

export type OnboardingDestination = 'new-pet' | 'stay';

interface UseOnboardingExitResult {
  /**
   * Close(X) 버튼 전용: petCount 조회 상태와 무관하게 완료 플래그만 즉시 저장한다.
   * 라우팅은 하지 않는다 — 모달을 닫는 것은 호출부(OnboardingOverlay)의 책임이다.
   */
  closeOnly: () => void;
  /**
   * "시작하기" 버튼 전용: 완료 플래그를 저장하고 petCount에 따른 목적지를 결정해
   * `onResolved` 콜백으로 알려준다. 실제 라우팅/모달 닫힘 처리는 호출부가 담당한다.
   */
  completeAndRoute: (onResolved: (destination: OnboardingDestination) => void) => void;
  /** petCount 조회 대기 중인지 여부 (PrimaryButton의 loading 표시용) */
  isResolvingExit: boolean;
}

/**
 * 온보딩 종료 시 목적지를 결정한다.
 *
 * 기본값은 `new-pet`(펫 미등록)이지만, 이미 반려동물이 등록된 예외 상태(과거 가입자가
 * 이번 기능 배포 이후 처음 로그인하는 경우 등)라면 `stay`(홈 유지)로 분기한다.
 */
export function useOnboardingExit(): UseOnboardingExitResult {
  const { petCount, loading } = usePetIds();
  const [isResolvingExit, setIsResolvingExit] = useState(false);
  const pendingResolve = useRef<((destination: OnboardingDestination) => void) | null>(null);

  const resolveDestination = useCallback(
    (): OnboardingDestination => (petCount !== null && petCount > 0 ? 'stay' : 'new-pet'),
    [petCount],
  );

  const finishPending = useCallback((destination: OnboardingDestination) => {
    const callback = pendingResolve.current;
    pendingResolve.current = null;
    setIsResolvingExit(false);
    callback?.(destination);
  }, []);

  useEffect(() => {
    if (!pendingResolve.current || loading) return;
    finishPending(resolveDestination());
  }, [loading, resolveDestination, finishPending]);

  useEffect(() => {
    if (!isResolvingExit) return;
    const timer = setTimeout(() => finishPending('new-pet'), EXIT_ROUTE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isResolvingExit, finishPending]);

  const closeOnly = useCallback(() => {
    // "시작하기" 처리 대기 중이었더라도 무효화한다 — Close 버튼은 그 대기 상태와
    // 무관하게 항상 즉시 반응해야 하고, 이후 타이머가 뒤늦게 라우팅하면 안 된다.
    pendingResolve.current = null;
    setIsResolvingExit(false);
    markOnboardingCompleted();
  }, []);

  const completeAndRoute = useCallback(
    (onResolved: (destination: OnboardingDestination) => void) => {
      markOnboardingCompleted();
      if (!loading) {
        onResolved(resolveDestination());
        return;
      }
      pendingResolve.current = onResolved;
      setIsResolvingExit(true);
    },
    [loading, resolveDestination],
  );

  return { closeOnly, completeAndRoute, isResolvingExit };
}
