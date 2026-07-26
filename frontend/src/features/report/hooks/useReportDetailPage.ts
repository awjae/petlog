'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { useReport } from './useReport';
import { useReportPolling } from './useReportPolling';
import { useGenerateReport } from './useGenerateReport';
import { PETS_FOR_REPORT_QUERY, REPORT_POLL_STATUS_QUERY } from '../api/report.queries';
import { categorizeFailureReason, formatPeriodRange } from '../utils/reportFormat';
import type { Report } from '../types/report.types';

interface ReportDetailPageLoading {
  status: 'loading';
}

interface ReportDetailPageError {
  status: 'error';
}

interface ReportDetailPageProcessing {
  status: 'processing';
  subtitle: string;
}

interface ReportDetailPageFailed {
  status: 'failed';
  subtitle: string;
  failureHeading: string;
  failureDesc: string;
  retrying: boolean;
  onRetry: () => void;
}

interface ReportDetailPageSuccess {
  status: 'success';
  report: Report;
  petName: string;
  subtitle: string;
}

export type ReportDetailPageResult =
  | ReportDetailPageLoading
  | ReportDetailPageError
  | ReportDetailPageProcessing
  | ReportDetailPageFailed
  | ReportDetailPageSuccess;

/**
 * 리포트 상세 페이지의 데이터 조회 + 파생 로직을 전담하는 훅.
 *
 * report 조회, 처리중 폴링, 실패 사유 조회, 재시도(재생성), 반려동물 이름 조회를
 * 하나로 오케스트레이션하고, 페이지 컴포넌트는 status 기준으로 렌더링만 분기한다.
 */
export function useReportDetailPage(reportId: string): ReportDetailPageResult {
  const router = useRouter();

  const { report, loading, error, refetch } = useReport(reportId);
  const isInFlight = report?.status === 'pending' || report?.status === 'processing';

  useReportPolling(isInFlight ? reportId : null, () => refetch());

  const { data: pollData } = useQuery(REPORT_POLL_STATUS_QUERY, {
    variables: { id: reportId },
    skip: report?.status !== 'failed',
    fetchPolicy: 'cache-first',
  });
  const failureNotice = categorizeFailureReason(pollData?.reportPollStatus.failedReason);

  const { generateReport, loading: retrying, error: retryError } = useGenerateReport();

  async function handleRetry() {
    if (!report?.petId) return;
    const newReportId = await generateReport(report.petId, report.periodStart, report.periodEnd);
    if (newReportId) {
      router.replace(`/reports/${newReportId}`);
    }
  }

  const { data: petsData } = useQuery(PETS_FOR_REPORT_QUERY, {
    fetchPolicy: 'cache-first',
  });
  const pets = petsData?.me?.pets ?? [];
  const petName = pets.find((p) => p.id === report?.petId)?.name ?? '';

  if (loading) {
    return { status: 'loading' };
  }

  if (error || !report) {
    return { status: 'error' };
  }

  const subtitle = [petName, formatPeriodRange(report.periodStart, report.periodEnd)]
    .filter(Boolean)
    .join(' · ');

  if (report.status === 'processing' || report.status === 'pending') {
    return { status: 'processing', subtitle };
  }

  if (report.status === 'failed') {
    return {
      status: 'failed',
      subtitle,
      failureHeading: failureNotice.heading,
      failureDesc: retryError || failureNotice.desc,
      retrying,
      onRetry: handleRetry,
    };
  }

  return {
    status: 'success',
    report,
    petName,
    subtitle,
  };
}
