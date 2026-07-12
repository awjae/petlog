'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { REGISTER_PUSH_TOKEN_MUTATION } from '../api/notification.api';

/**
 * 네이티브 앱(Capacitor)에서 푸시 알림 권한을 요청하고, 발급받은 FCM/APNS 토큰을
 * 백엔드에 등록한다.
 *
 * - 웹 브라우저(Capacitor.isNativePlatform() === false)에서는 아무 동작도 하지 않는다.
 *   Web Push는 이번 스코프에 포함하지 않는다.
 * - `enabled`가 false인 동안은 등록을 시도하지 않는다. registerPushToken은 인증이
 *   필요한 mutation이라 비로그인 상태(공개 라우트 등)에서 호출하면 401로 실패한다 —
 *   호출부(NotificationProvider)가 로그인 여부를 판단해 넘겨준다.
 * - 권한 거부(registrationError)는 흔한 케이스이므로 콘솔 로그만 남기고
 *   사용자에게 별도 UI를 노출하지 않는다.
 */
export function usePushNotificationRegistration(enabled: boolean): void {
  const [registerPushToken] = useMutation(REGISTER_PUSH_TOKEN_MUTATION, {
    onError: () => {
      // 토큰 등록 실패는 조용히 무시한다 — 사용자가 직접 트리거한 액션이 아니므로
      // 에러 UI를 띄울 대상이 없다. 다음 앱 실행 시 재시도된다.
    },
  });

  // effect의 의존성 배열을 [enabled]로 유지하면서도 항상 최신 mutate 함수를 쓰기 위한 ref.
  const registerPushTokenRef = useRef(registerPushToken);
  registerPushTokenRef.current = registerPushToken;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let removeListeners: (() => void) | undefined;

    async function setup() {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import('@capacitor/push-notifications');

      // register() 호출 전에 리스너를 먼저 등록해야 registration 이벤트를 놓치지 않는다.
      const registrationHandle = await PushNotifications.addListener('registration', (token) => {
        registerPushTokenRef.current({ variables: { token: token.value } }).catch(() => {});
      });

      const registrationErrorHandle = await PushNotifications.addListener(
        'registrationError',
        (err) => {
          console.error('[push] 토큰 등록 실패:', err);
        },
      );

      if (cancelled) {
        registrationHandle.remove();
        registrationErrorHandle.remove();
        return;
      }

      removeListeners = () => {
        registrationHandle.remove();
        registrationErrorHandle.remove();
      };

      const permission = await PushNotifications.requestPermissions();
      if (cancelled || permission.receive !== 'granted') return;

      await PushNotifications.register();
    }

    setup().catch((err) => {
      console.error('[push] 초기화 실패:', err);
    });

    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, [enabled]);
}
