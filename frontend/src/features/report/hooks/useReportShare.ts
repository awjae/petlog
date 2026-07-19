'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { REPORT_SHARE_SETTINGS_QUERY } from '../api/report-share.queries';
import {
  START_REPORT_SHARE_MUTATION,
  STOP_REPORT_SHARE_MUTATION,
  SET_REPORT_SHARE_INCLUDE_CONCERNS_MUTATION,
} from '../api/report-share.mutations';
import type { ReportShareSettings } from '../types/report-share.types';

interface UseReportShareOptions {
  skip?: boolean;
}

interface UseReportShareReturn {
  settings: ReportShareSettings | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  /** 활성 공유를 보장하고 토큰을 반환한다. 이미 활성 상태면 재발급 없이 기존 토큰을 재사용한다. */
  ensureActiveShare: () => Promise<string | null>;
  stopShare: () => Promise<boolean>;
  toggleIncludeConcerns: (next: boolean) => Promise<void>;
  starting: boolean;
  stopping: boolean;
  toggleError: string;
  actionError: string;
  clearActionError: () => void;
}

export function useReportShare(
  reportId: string,
  options: UseReportShareOptions = {},
): UseReportShareReturn {
  const {
    data,
    loading,
    error,
    refetch: refetchQuery,
  } = useQuery(REPORT_SHARE_SETTINGS_QUERY, {
    variables: { reportId },
    skip: options.skip || !reportId,
    // 시트를 열 때마다 최신 상태를 확인한다 — 다른 기기/탭에서 중지했을 수도 있다.
    fetchPolicy: 'network-only',
  });

  // 서버 조회 결과를 로컬 상태로 복제해 토글 낙관적 업데이트와 롤백을 다룬다.
  const [settings, setSettings] = useState<ReportShareSettings | null>(null);
  const [toggleError, setToggleError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (data?.reportShareSettings) setSettings(data.reportShareSettings);
  }, [data]);

  const [startMutate, { loading: starting }] = useMutation(START_REPORT_SHARE_MUTATION);
  const [stopMutate, { loading: stopping }] = useMutation(STOP_REPORT_SHARE_MUTATION);
  const [toggleMutate] = useMutation(SET_REPORT_SHARE_INCLUDE_CONCERNS_MUTATION);

  const ensureActiveShare = useCallback(async (): Promise<string | null> => {
    setActionError('');
    if (settings?.isActive && settings.shareToken) return settings.shareToken;

    const result = await startMutate({ variables: { reportId } }).catch(() => null);
    const next = result?.data?.startReportShare;
    if (!next) {
      setActionError('공유를 시작하지 못했어요. 다시 시도해주세요.');
      return null;
    }
    setSettings(next);
    return next.shareToken;
  }, [reportId, settings, startMutate]);

  const stopShare = useCallback(async (): Promise<boolean> => {
    setActionError('');
    const result = await stopMutate({ variables: { reportId } }).catch(() => null);
    const next = result?.data?.stopReportShare;
    if (!next) {
      setActionError('공유를 중지하지 못했어요. 다시 시도해주세요.');
      return false;
    }
    setSettings(next);
    return true;
  }, [reportId, stopMutate]);

  const toggleIncludeConcerns = useCallback(
    async (next: boolean) => {
      if (!settings) return;
      setToggleError('');
      const previous = settings;
      setSettings({ ...settings, includeConcerns: next });

      const result = await toggleMutate({
        variables: { reportId, includeConcerns: next },
      }).catch(() => null);
      const updated = result?.data?.setReportShareIncludeConcerns;

      if (!updated) {
        setSettings(previous);
        setToggleError('변경하지 못했어요. 다시 시도해주세요.');
        return;
      }
      setSettings(updated);
    },
    [reportId, settings, toggleMutate],
  );

  return {
    settings,
    loading,
    error,
    refetch: () => {
      refetchQuery().catch(() => {});
    },
    ensureActiveShare,
    stopShare,
    toggleIncludeConcerns,
    starting,
    stopping,
    toggleError,
    actionError,
    clearActionError: () => setActionError(''),
  };
}
