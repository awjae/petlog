'use client';

import { useEffect, useRef } from 'react';

/**
 * 열려 있는 오버레이(바텀시트/모달/다이얼로그)를 "뒤로 가기"로 닫는다.
 *
 * 두 가지 입력을 같은 의미로 취급한다.
 * - Android 하드웨어/제스처 백 버튼 (Capacitor 앱)
 * - Escape 키 (웹, 특히 PC 브라우저)
 *
 * 왜 필요한가:
 * Capacitor 앱에서 backButton 리스너가 하나도 없으면 웹뷰 기본 동작(히스토리 back,
 * 없으면 앱 종료)이 실행된다. 시트는 라우트를 바꾸지 않으므로, 시트를 열어둔 채
 * 뒤로 가기를 누르면 시트가 닫히는 게 아니라 화면 자체가 넘어가거나 앱이 꺼진다.
 *
 * 스택으로 관리하는 이유:
 * 시트 위에 시트가 겹칠 수 있다(예: 리포트 기간 시트 위 DatePickerSheet). 리스너를
 * 각자 등록하면 뒤로 가기 한 번에 둘 다 닫힌다. 열린 순서대로 쌓고 가장 위의 것만
 * 닫는다.
 */

type DismissHandler = () => void;

const stack: DismissHandler[] = [];

function dismissTop(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
}

// --- Escape (웹) ---
let keydownBound = false;

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (dismissTop()) {
    e.preventDefault();
  }
}

// --- Android 백 버튼 (Capacitor) ---
// 리스너는 앱 전체에서 하나만 유지한다. 오버레이마다 addListener를 부르면 한 번의
// 백 이벤트에 여러 핸들러가 동시에 반응한다.
let nativeListenerHandle: { remove: () => void } | null = null;
let nativeListenerPending = false;

async function bindNativeBackButton() {
  if (nativeListenerHandle || nativeListenerPending) return;
  nativeListenerPending = true;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { App } = await import('@capacitor/app');
    nativeListenerHandle = await App.addListener('backButton', ({ canGoBack }) => {
      if (dismissTop()) return;

      // 열린 오버레이가 없으면 웹뷰 기본 동작을 우리가 대신 수행한다. 리스너를 등록한
      // 순간부터 Capacitor의 기본 처리가 비활성화되기 때문에, 이걸 빼면 앱에서
      // 뒤로 가기가 완전히 먹통이 된다.
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp().catch(() => {
          // iOS 등 미구현 플랫폼 — backButton 자체가 Android 전용이라 실질적으로 없다.
        });
      }
    });
  } catch {
    // Capacitor 모듈 로드 실패(순수 웹 배포 등)는 무시한다. Escape는 그대로 동작한다.
  } finally {
    nativeListenerPending = false;
  }
}

export function useOverlayDismiss(isOpen: boolean, onDismiss: () => void): void {
  // 핸들러를 ref에 담아 스택에 넣는다. onDismiss가 매 렌더 새 함수여도
  // 스택을 다시 쌓지 않기 위해서다(다시 쌓으면 순서가 뒤집힌다).
  const handlerRef = useRef(onDismiss);
  handlerRef.current = onDismiss;

  useEffect(() => {
    if (!isOpen) return;

    const entry: DismissHandler = () => handlerRef.current();
    stack.push(entry);

    if (!keydownBound) {
      document.addEventListener('keydown', handleKeydown);
      keydownBound = true;
    }
    void bindNativeBackButton();

    return () => {
      const index = stack.lastIndexOf(entry);
      if (index !== -1) stack.splice(index, 1);

      if (stack.length === 0 && keydownBound) {
        document.removeEventListener('keydown', handleKeydown);
        keydownBound = false;
      }
    };
  }, [isOpen]);
}
