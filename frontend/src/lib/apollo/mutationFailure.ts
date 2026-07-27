import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client';

/**
 * 뮤테이션 실패의 종류.
 *
 * 지금까지는 모든 실패가 "저장에 실패했어요" 하나로 뭉뚱그려져 있어서, 사용자에게
 * 다음 행동을 안내할 수도 없고 오프라인 대응이 실제로 필요한지도 알 수 없었다.
 * (`.claude/docs/decisions/033-offline-record-queue.md` 참고)
 */
export type MutationFailureKind =
  /** 기기가 네트워크에 연결되어 있지 않다. */
  | 'offline'
  /** 연결은 되어 있지만 요청이 서버에 닿지 못했다 (약한 신호, DNS, 타임아웃). */
  | 'network'
  /** 서버가 응답했지만 요청을 거절했다 (검증 실패 등). */
  | 'server-rejected'
  /** 서버/프록시가 비정상 응답을 돌려줬다 (5xx, 파싱 불가). */
  | 'server-unavailable'
  /** 위 어디에도 해당하지 않는다. 대부분 클라이언트 쪽 버그다. */
  | 'unknown';

/**
 * 응답이 도착했음을 증명하는 종류(server-*)를 먼저 판정한다. 응답을 받았다면 그 시점에
 * 온라인이었다는 뜻이므로, `navigator.onLine`을 먼저 보면 잘못 분류될 수 있다.
 */
export function classifyMutationFailure(error: unknown): MutationFailureKind {
  if (CombinedGraphQLErrors.is(error)) return 'server-rejected';
  if (ServerError.is(error) || ServerParseError.is(error)) return 'server-unavailable';

  // navigator.onLine의 false는 신뢰할 수 있다(연결 없음). 반대로 true는 "인터페이스가
  // 살아 있다"는 뜻일 뿐 실제 도달 가능성을 보장하지 않으므로 아래 network로 넘긴다.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';

  // fetch는 네트워크 단계에서 실패하면 TypeError를 던진다. 메시지는 브라우저마다 다르므로
  // 문구 대신 타입으로 판정한다.
  if (error instanceof TypeError) return 'network';

  return 'unknown';
}

const FAILURE_MESSAGE: Record<MutationFailureKind, string> = {
  offline: '지금 오프라인이에요. 연결되면 다시 시도해주세요',
  network: '연결이 불안정해요. 잠시 후 다시 시도해주세요',
  'server-rejected': '저장에 실패했어요. 다시 시도해주세요',
  'server-unavailable': '일시적인 오류예요. 잠시 후 다시 시도해주세요',
  unknown: '저장에 실패했어요. 다시 시도해주세요',
};

export function mutationFailureMessage(kind: MutationFailureKind): string {
  return FAILURE_MESSAGE[kind];
}
