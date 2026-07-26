import { graphql, HttpResponse } from 'msw';
import type { Report } from '@/features/report/types/report.types';

// AI 리포트(frontend/src/features/report) 관련 MSW 핸들러.
//
// 시나리오 전환은 페이지 URL의 ?mockScenario= 쿼리 파라미터로 한다.
// (예: /reports?mockScenario=insufficient) — worker.use() 런타임 override 대신 이 방식을
// 쓰는 이유는, 핸들러가 브라우저 메인 스레드에서 실행돼 window.location에 바로 접근할 수
// 있고, Playwright 쪽에서 page.goto(url)만으로 시나리오를 결정할 수 있어 타입 안전하고
// 단순하기 때문이다.
//
// 기본값(파라미터 없음)은 happy path: 기록 충분(recordCount/recordDays가
// backend/src/report/report.service.ts의 MIN_RECORD_COUNT=10 / MIN_RECORD_DAYS=7을
// 충족) + 이번 달 생성 가능.
const PET_ID = 'pet-1';
const PET_NAME = '초코';
const PET_CREATED_AT = '2025-01-01T00:00:00.000Z';
const REPORT_ID = 'report-mock-1';

type MockScenario = 'default' | 'insufficient' | 'generate-failed';

function getScenario(): MockScenario {
  if (typeof window === 'undefined') return 'default';
  const value = new URLSearchParams(window.location.search).get('mockScenario');
  if (value === 'insufficient' || value === 'generate-failed') return value;
  return 'default';
}

// 리포트 생성 완료 여부를 페이지가 살아있는 동안 기억해 "생성 전 CTA" → "생성 후 지난
// 리포트" 상태 전환을 재현한다. 전체 페이지 새로고침(reload/재방문) 시 초기화된다.
let generatedReport: Report | null = null;

// GenerateReport 요청이 접수된 뒤 폴링이 terminal 상태(completed/failed)에 도달하기
// 전까지의 "처리 중" reportId. ReportStatus.processingReport로 노출해, 클라이언트 상태
// (pollingReportId)가 사라진 뒤(컴포넌트 언마운트, 라우트 이동 후 복귀)에도 실제 앱처럼
// polling UI를 복원할 수 있게 한다. GenerateReport 호출 시점에는 아직 완성된 리포트가
// 아니므로, generatedReport는 폴링이 completed에 도달했을 때 비로소 확정한다.
let processingReportId: string | null = null;
let pendingPeriod: { periodStart: string; periodEnd: string } | null = null;

// reportId별 ReportPollStatus 호출 횟수. useReportPolling(frontend/src/features/report/
// hooks/useReportPolling.ts)은 pollInterval(3000ms)로 폴링하는데, mount 시 첫 요청이
// "즉시" 나간다. 만약 그 첫 응답부터 completed/failed를 반환하면 화면이 로딩 상태를
// 거치지 않고 곧바로 결과 상태로 바뀌어버려(실제로 Playwright에서 flaky하게 재현됨),
// "로딩 → 결과" 전환을 테스트가 안정적으로 관찰할 수 없다. 그래서 첫 번째 폴링 응답은
// 항상 processing으로 고정하고, 두 번째 폴링(약 3초 후)부터 최종 상태를 반환해 실제
// 비동기 생성 흐름에 더 가깝게 만든다. reportId별 Map으로 관리해 재시도/다회 생성 시에도
// GenerateReport가 카운트를 0으로 초기화하면 매번 같은 규칙이 적용된다.
const pollCallCountByReportId = new Map<string, number>();

export const reportHandlers = [
  graphql.query('PetsForReport', () => {
    return HttpResponse.json({
      data: { me: { pets: [{ id: PET_ID, name: PET_NAME, createdAt: PET_CREATED_AT }] } },
    });
  }),

  graphql.query('ReportStatus', () => {
    if (getScenario() === 'insufficient') {
      return HttpResponse.json({
        data: {
          reportStatus: {
            canGenerateThisMonth: true,
            hasEnoughRecords: false,
            recordCount: 3,
            recordDays: 2,
            nextAvailableAt: null,
            processingReport: null,
          },
        },
      });
    }

    return HttpResponse.json({
      data: {
        reportStatus: {
          canGenerateThisMonth: !generatedReport && !processingReportId,
          hasEnoughRecords: true,
          recordCount: 15,
          recordDays: 10,
          nextAvailableAt: generatedReport ? '2026-08-01T00:00:00.000Z' : null,
          processingReport: processingReportId
            ? { id: processingReportId, status: 'processing' }
            : null,
        },
      },
    });
  }),

  graphql.query('ReportPeriodPreview', () => {
    if (getScenario() === 'insufficient') {
      return HttpResponse.json({
        data: { reportPeriodPreview: { recordCount: 3, recordDays: 2, hasEnoughRecords: false } },
      });
    }

    return HttpResponse.json({
      data: { reportPeriodPreview: { recordCount: 15, recordDays: 10, hasEnoughRecords: true } },
    });
  }),

  graphql.mutation('GenerateReport', ({ variables }) => {
    const { periodStart, periodEnd } = variables as { periodStart: string; periodEnd: string };

    // 실제 생성은 비동기라 요청 시점에는 성공/실패를 알 수 없다 — 완성된 리포트
    // 확정(generatedReport)이나 실패 판정은 ReportPollStatus가 terminal 상태에
    // 도달했을 때 한다. 여기서는 "처리 중" 상태만 기록한다.
    processingReportId = REPORT_ID;
    pendingPeriod = { periodStart, periodEnd };
    pollCallCountByReportId.set(REPORT_ID, 0);

    return HttpResponse.json({
      data: { generateReport: { reportId: REPORT_ID, status: 'processing' } },
    });
  }),

  graphql.query('ReportPollStatus', ({ variables }) => {
    const { id } = variables as { id: string };
    const callCount = (pollCallCountByReportId.get(id) ?? 0) + 1;
    pollCallCountByReportId.set(id, callCount);
    const isFirstPoll = callCount === 1;

    if (getScenario() === 'generate-failed') {
      if (isFirstPoll) {
        return HttpResponse.json({
          data: { reportPollStatus: { id, status: 'processing', failedReason: null } },
        });
      }
      processingReportId = null;
      pendingPeriod = null;
      return HttpResponse.json({
        data: { reportPollStatus: { id, status: 'failed', failedReason: 'AI_PROVIDER_ERROR' } },
      });
    }

    if (isFirstPoll) {
      return HttpResponse.json({
        data: { reportPollStatus: { id, status: 'processing', failedReason: null } },
      });
    }

    if (!generatedReport && pendingPeriod) {
      generatedReport = {
        id: REPORT_ID,
        petId: PET_ID,
        status: 'completed',
        overview: '이번 기간 동안 초코는 전반적으로 안정적인 컨디션을 유지했어요.',
        highlights: ['체중이 꾸준히 유지되고 있어요', '활동량이 이전 대비 늘었어요'],
        concerns: ['최근 기침 기록이 2회 있었어요'],
        recommendations: ['기침이 계속되면 병원 방문을 고려해보세요'],
        generatedBy: 'mock',
        periodStart: pendingPeriod.periodStart,
        periodEnd: pendingPeriod.periodEnd,
        createdAt: new Date().toISOString(),
      };
    }
    processingReportId = null;
    pendingPeriod = null;

    return HttpResponse.json({
      data: { reportPollStatus: { id, status: 'completed', failedReason: null } },
    });
  }),

  graphql.query('Reports', () => {
    return HttpResponse.json({
      data: { reports: generatedReport ? [generatedReport] : [] },
    });
  }),

  graphql.query('Report', ({ variables }) => {
    const { id } = variables as { id: string };
    if (generatedReport && generatedReport.id === id) {
      return HttpResponse.json({ data: { report: generatedReport } });
    }
    return HttpResponse.json({ data: { report: null } });
  }),
];
