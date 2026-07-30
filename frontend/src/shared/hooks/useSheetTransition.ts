'use client';

import { useCallback, useEffect, useState } from 'react';

// CSS transition(300ms)이 끝난 뒤 언마운트하기 위한 여유값. 시트 CSS의
// transition-duration과 함께 움직여야 하므로 한곳에서 관리한다.
const EXIT_DURATION_MS = 310;

interface SheetTransition {
  /** DOM에 존재해야 하는가 (닫히는 애니메이션 동안 true를 유지한다) */
  mounted: boolean;
  /** 열린 상태 클래스를 붙일 것인가 */
  visible: boolean;
  /** 닫는 애니메이션을 재생한 뒤 onClose를 호출한다 */
  close: () => void;
  /**
   * 닫는 애니메이션을 재생한 뒤 지정한 동작을 호출한다.
   * 닫으면서 다른 흐름으로 넘어가는 경우에 쓴다(예: 탈퇴 안내 시트의 "계속하기").
   */
  closeWith: (action: () => void) => void;
}

/**
 * 바텀시트/모달의 열림·닫힘 전환 상태.
 *
 * 시트 9종이 동일한 로직(rAF 두 번 + 310ms 지연 언마운트)을 각자 복제하고 있었다.
 * 애니메이션 타이밍을 바꾸려면 9곳을 고쳐야 했고, 실제로 한 곳이라도 빠지면
 * 화면마다 닫히는 속도가 달라진다.
 *
 * rAF를 두 번 겹치는 이유: 마운트 직후 같은 프레임에 열림 클래스를 붙이면 브라우저가
 * 시작 상태를 인식하지 못해 transition이 재생되지 않고 즉시 최종 상태로 점프한다.
 */
export function useSheetTransition(isOpen: boolean, onClose: () => void): SheetTransition {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // 대기 중인 rAF는 반드시 취소한다. isOpen이 두 프레임 안에 true→false로 뒤집히면
      // 뒤늦게 setVisible(true)가 실행돼, 닫힘 애니메이션 없이 310ms 뒤 그냥 사라진다.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        if (inner) cancelAnimationFrame(inner);
      };
    }

    setVisible(false);
    const timer = setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const closeWith = useCallback((action: () => void) => {
    setVisible(false);
    setTimeout(action, EXIT_DURATION_MS);
  }, []);

  const close = useCallback(() => closeWith(onClose), [closeWith, onClose]);

  return { mounted, visible, close, closeWith };
}
