'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CombinedGraphQLErrors } from '@apollo/client';
import { SEND_TEST_PUSH_NOTIFICATION_MUTATION } from '../api/notification.api';

const DEFAULT_ERROR_MESSAGE = '테스트 알림을 보내지 못했어요. 다시 시도해주세요.';

// 백엔드는 등록된 기기가 없으면 BadRequestException('등록된 푸시 토큰이 없습니다.')를
// 던진다 — 이런 구체적인 사유는 그대로 노출하는 편이 사용자에게 다음 행동(예: 앱 재실행,
// 알림 권한 허용)을 알려주는 데 도움이 된다.
function extractErrorMessage(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const message = error.errors[0]?.message;
    if (message) return message;
  }
  return DEFAULT_ERROR_MESSAGE;
}

export function useSendTestPushNotification() {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(SEND_TEST_PUSH_NOTIFICATION_MUTATION, {
    onError: (err) => setError(extractErrorMessage(err)),
  });

  async function sendTestPushNotification(): Promise<boolean> {
    setError('');
    const result = await mutate().catch(() => null);
    return result?.data?.sendTestPushNotification === true;
  }

  return { sendTestPushNotification, loading, error };
}
