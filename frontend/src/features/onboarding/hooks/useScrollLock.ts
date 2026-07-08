'use client';

import { useEffect } from 'react';

/**
 * 오버레이 노출 중 배경(`/home`) 스크롤을 잠근다.
 *
 * `active`가 false로 바뀌거나 컴포넌트가 언마운트되면 원래 overflow 값으로 복원한다.
 * 온보딩 오버레이는 등장부터 퇴장 애니메이션이 끝날 때까지(완전히 unmount되기 전까지)
 * 계속 mount된 상태를 유지하므로, 호출부는 "완전히 닫히기 전"까지 active=true를 유지해야 한다.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [active]);
}
