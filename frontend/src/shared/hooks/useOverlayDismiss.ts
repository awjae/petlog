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
 * 오버레이 위에 오버레이가 겹칠 수 있다(예: ShareReportSheet 위 StopShareConfirmDialog).
 * 리스너를
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

  // 한글 입력 중 Escape는 IME의 "조합 취소"다. 여기서 가로채면 조합만 되돌리려던
  // 사용자가 시트째로 닫아 입력을 통째로 잃는다.
  if (e.isComposing) return;

  if (dismissTop()) {
    e.preventDefault();
  }
}

// --- Android 백 버튼 (Capacitor) ---
//
// 리스너는 "열린 오버레이가 있는 동안"에만 유지한다. 앱 수명 내내 붙여두면 안 된다 —
// Capacitor의 AppPlugin은 리스너가 하나라도 등록돼 있으면 네이티브 기본 처리를
// 통째로 비활성화하기 때문이다(android/.../AppPlugin.java의 hasListeners 분기).
//
// 그 기본 처리는 "canGoBack이면 goBack(), 아니면 아무것도 하지 않음"이다. 앱을
// 종료하지 않는다. 리스너를 계속 붙여둔 채 종료를 흉내 내면, 시트를 한 번 연 것만으로
// 첫 화면의 뒤로 가기가 앱 종료로 바뀌어 버린다.
//
// 오버레이마다 addListener를 부르지는 않는다. 그러면 한 번의 백 이벤트에 여러 핸들러가
// 동시에 반응한다. 스택이 비어 있다가 처음 채워질 때 한 번 붙이고, 다시 비면 뗀다.
let nativeListenerHandle: { remove: () => void } | null = null;

// bind/unbind가 비동기(동적 import)라 서로 앞지를 수 있다. 요청마다 토큰을 올려서
// "가장 마지막 요청"만 유효하게 만든다.
let nativeBindToken = 0;

async function bindNativeBackButton() {
  if (nativeListenerHandle) return;
  const token = ++nativeBindToken;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('backButton', ({ canGoBack }) => {
      if (dismissTop()) return;

      // 여기까지 오는 건 "리스너는 아직 붙어 있는데 스택은 비어 있는" 짧은 구간뿐이다
      // (unbind가 완료되기 전). 네이티브 기본 동작과 같게 처리한다 — canGoBack이
      // 아니면 아무것도 하지 않는다.
      if (canGoBack) {
        window.history.back();
      }
    });

    // 등록이 끝나기 전에 스택이 비어 unbind가 요청됐다면 즉시 뗀다.
    if (token !== nativeBindToken) {
      handle.remove();
      return;
    }
    nativeListenerHandle = handle;
  } catch {
    // Capacitor 모듈 로드 실패(순수 웹 배포 등)는 무시한다. Escape는 그대로 동작한다.
  }
}

function unbindNativeBackButton() {
  nativeBindToken++;
  nativeListenerHandle?.remove();
  nativeListenerHandle = null;
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

      if (stack.length === 0) {
        if (keydownBound) {
          document.removeEventListener('keydown', handleKeydown);
          keydownBound = false;
        }
        unbindNativeBackButton();
      }
    };
  }, [isOpen]);
}
