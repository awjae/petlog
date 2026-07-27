import * as Sentry from '@sentry/nextjs';
import type { MutationFailureKind } from '@/lib/apollo/mutationFailure';

/**
 * 뮤테이션 실패를 종류별로 셀 수 있게 Sentry에 남긴다.
 *
 * 목적은 디버깅이 아니라 측정이다 — "오프라인 대응이 필요한가"라는 질문에 답하려면
 * 실패가 얼마나 자주, 어떤 이유로 일어나는지부터 알아야 한다. 그래서 사용자가 이미
 * 안내를 받은 실패(검증 거절 등)도 함께 보낸다. level은 warning이라 이슈 알림을
 * 울리지 않고 `failureKind` 태그로 집계만 된다.
 */
export function reportMutationFailure(
  flow: string,
  kind: MutationFailureKind,
  error: unknown,
): void {
  Sentry.captureException(error, {
    level: 'warning',
    tags: { flow, failureKind: kind },
    extra: {
      // 판정 시점의 원값. classifyMutationFailure가 실제 상황을 얼마나 맞히는지
      // 나중에 대조하기 위해 남긴다.
      navigatorOnLine: typeof navigator !== 'undefined' ? navigator.onLine : null,
    },
  });
}
