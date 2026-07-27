import * as Sentry from '@sentry/nextjs';
import type { MutationFailureKind } from '@/lib/apollo/mutationFailure';

/**
 * 계측 대상 흐름. raw string을 받으면 호출부 오타가 조용히 새 태그 값을 만들어
 * 집계가 쪼개지므로 유니온으로 좁힌다. 흐름을 늘릴 때 여기에 추가한다.
 */
export type MutationFlow = 'create-health-record';

/**
 * 뮤테이션 실패를 종류별로 셀 수 있게 Sentry에 남긴다.
 *
 * 목적은 디버깅이 아니라 측정이다 — "오프라인 대응이 필요한가"에 답하려면 실패가
 * 얼마나 자주, 어떤 이유로 일어나는지부터 알아야 한다. 그래서 사용자가 이미 안내를
 * 받은 실패(검증 거절 등)도 함께 보낸다.
 *
 * captureException이 아니라 captureMessage인 이유가 두 가지다.
 * 1. 리플레이 integration은 `event.exception`이 있으면 level과 무관하게 세션 리플레이를
 *    올린다. replaysOnErrorSampleRate가 1.0이라 저장 실패 한 건마다 리플레이 한 건이
 *    올라가고, 무료 리플레이 쿼터(월 50건)가 실패 50번에 소진된다.
 * 2. captureException은 에러 타입별로 이슈를 쪼개서 집계 단위가 실패 종류와 어긋난다.
 *    메시지 기준이면 이슈 하나 안에 태그로 종류가 모인다.
 *
 * 원인 추적에 필요한 정보는 태그와 extra로 대신 싣는다.
 */
export function reportMutationFailure(
  flow: MutationFlow,
  kind: MutationFailureKind,
  error: unknown,
): void {
  const err = error instanceof Error ? error : undefined;

  Sentry.captureMessage('mutation-failure', {
    level: 'warning',
    // 실패 종류가 달라도 이슈가 쪼개지지 않게 그룹을 흐름 단위로 고정한다.
    fingerprint: ['mutation-failure', flow],
    tags: {
      flow,
      failureKind: kind,
      // 판정 시점의 원값. classifyMutationFailure가 실제 상황을 얼마나 맞히는지
      // 대조하려면 검색·집계가 되는 태그여야 한다(extra는 필터 대상이 아니다).
      navigatorOnLine: typeof navigator !== 'undefined' ? String(navigator.onLine) : 'unknown',
      // unknown 버킷에 무엇이 섞여 있는지 사후에 판별하는 단서.
      errorName: err?.name ?? 'unknown',
    },
    extra: { errorMessage: err?.message },
  });
}
