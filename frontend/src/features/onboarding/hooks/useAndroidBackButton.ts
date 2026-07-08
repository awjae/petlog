'use client';

import { useEffect, useRef } from 'react';

interface BackButtonState {
  hasPrevious: boolean;
  onBack: () => void;
  /**
   * 첫 슬라이드에서 뒤로가기 시 실행할 동작. 지정하지 않으면 기존처럼 앱을 종료한다
   * (전체화면 라우트로 쓰이던 시절의 기본 동작 — 하위 호환을 위해 유지).
   */
  onExit?: () => void;
}

/**
 * Capacitor 앱(Android)에서 하드웨어/제스처 백 버튼을 가로챈다.
 *
 * 정책:
 * - 첫 슬라이드가 아니면 이전 슬라이드로 이동한다 (반대 스와이프/인디케이터 탭과 동일한 동작).
 * - 첫 슬라이드면 `onExit`을 호출한다. 온보딩이 `/home` 위에 뜨는 모달이 된 이후로는
 *   "앱 종료"가 아니라 "모달 닫기(Close와 동일)"가 자연스러운 기본 동작이다.
 *   `onExit`을 넘기지 않은 호출부를 위해 앱 종료 폴백은 남겨둔다.
 *
 * 웹(@capacitor/app의 web 구현)에서는 backButton 이벤트 자체가 발생하지 않으므로
 * 이 훅은 순수 웹 배포(브라우저 접속)에는 영향을 주지 않는다. 그럼에도
 * Capacitor.isNativePlatform()으로 한 번 더 명시적으로 게이팅해 네이티브 환경에서만
 * 동작하도록 한다.
 */
export function useAndroidBackButton({ hasPrevious, onBack, onExit }: BackButtonState): void {
  const stateRef = useRef<BackButtonState>({ hasPrevious, onBack, onExit });
  stateRef.current = { hasPrevious, onBack, onExit };

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cancelled = false;

    async function register() {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('backButton', () => {
        const { hasPrevious: canGoBack, onBack: goBack, onExit: exit } = stateRef.current;
        if (canGoBack) {
          goBack();
        } else if (exit) {
          exit();
        } else {
          App.exitApp().catch(() => {
            // 일부 플랫폼(iOS)에서는 미구현으로 reject될 수 있으나
            // backButton 이벤트 자체가 Android 전용이라 실질적으로 발생하지 않는다.
          });
        }
      });

      if (cancelled) {
        handle.remove();
      } else {
        removeListener = () => handle.remove();
      }
    }

    register();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}
