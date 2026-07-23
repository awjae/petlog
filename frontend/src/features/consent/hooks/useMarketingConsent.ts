'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { CONSENT_STATUS_QUERY, UPDATE_MARKETING_CONSENT_MUTATION } from '../api/consent.api';

// 토글을 짧은 시간에 여러 번 누르면 append-only 이력 테이블(user_consents)에 그만큼
// 행이 쌓인다. 여기서는 마지막 상태가 정착될 때까지 서버 반영을 미뤄서, 실제로
// "정착된" 동의 상태 변경만 이력으로 남긴다.
const SYNC_DEBOUNCE_MS = 600;

/**
 * useNotificationPreference(frontend/src/features/notification/hooks/useNotificationPreference.ts)와
 * 유사하게 Apollo useQuery + useMutation을 쓰되, 뮤테이션 자체는 디바운스한다.
 * 토글 스위치는 클릭 즉시 낙관적으로 반영되고, 실제 서버 반영은 사용자가 토글을 멈춘 뒤
 * SYNC_DEBOUNCE_MS가 지나야 일어난다. 그 사이 다시 토글하면 타이머만 재시작된다.
 */
export function useMarketingConsent() {
  const { data, loading, error } = useQuery(CONSENT_STATUS_QUERY);
  const [mutate] = useMutation(UPDATE_MARKETING_CONSENT_MUTATION);

  const serverAgreed = data?.consentStatus.marketingNotificationAgreed ?? false;
  const [optimisticAgreed, setOptimisticAgreed] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 서버 값이 바뀌면(다른 탭에서의 변경 등) 낙관적 오버레이를 비워 서버 값을 신뢰한다.
  useEffect(() => {
    setOptimisticAgreed(null);
  }, [serverAgreed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function updateMarketingConsent(agreed: boolean, onSettled?: (ok: boolean) => void): void {
    setOptimisticAgreed(agreed);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      mutate({ variables: { agreed } })
        .then((result) => {
          const ok = result.data?.updateMarketingConsent != null;
          if (!ok) setOptimisticAgreed(null);
          onSettled?.(ok);
        })
        .catch(() => {
          setOptimisticAgreed(null);
          onSettled?.(false);
        });
    }, SYNC_DEBOUNCE_MS);
  }

  return {
    agreed: optimisticAgreed ?? serverAgreed,
    loading,
    error: error != null,
    updateMarketingConsent,
  };
}
