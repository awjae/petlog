import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client';
import { isServerFaultError, isUnauthenticatedError } from '@/lib/apollo/graphqlError';
import { AuthRequestError } from '@/lib/auth/authRequestError';
import { SessionExpiredError } from '@/lib/auth/sessionExpiredError';

/**
 * 뮤테이션 실패의 종류.
 *
 * 지금까지 모든 실패가 "저장에 실패했어요" 하나로 뭉뚱그려져 있었다. 인터넷이 끊겨서
 * 실패한 것과 서버가 값을 거절한 것은 사용자가 할 일이 전혀 다른데도 같은 문구를 봤다.
 */
export type MutationFailureKind =
  /** 로그인 세션이 만료됐다. 재시도가 아니라 재로그인이 필요하다. */
  | 'session-expired'
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
  // errorLink가 토큰 리프레시를 서버가 거절했을 때 던진다. 리프레시 후 재시도가 또
  // 인증 실패로 돌아온 경우도 같다 — 재시도가 아니라 재로그인이 필요한 상태다.
  if (SessionExpiredError.is(error)) return 'session-expired';
  if (isUnauthenticatedError(error)) return 'session-expired';

  // 리프레시 요청이 실패한 경우. 401/403은 위에서 SessionExpiredError로 걸러졌으므로
  // 여기 오는 건 서버 장애(5xx)나 레이트 리밋(429), 혹은 예상 못한 4xx다.
  if (AuthRequestError.is(error)) {
    return error.status >= 500 || error.status === 429 ? 'server-unavailable' : 'unknown';
  }

  // 값이 잘못된 것과 서버가 고장난 것은 사용자가 할 일이 다르다.
  if (isServerFaultError(error)) return 'server-unavailable';
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
  // 이 경우 errorLink가 /login으로 보내므로 문구는 잠깐 보인다. 그래도 "다시
  // 시도해주세요"라고 잘못 안내하지 않는 편이 낫다.
  'session-expired': '로그인이 만료됐어요. 다시 로그인해주세요',
  offline: '지금 오프라인이에요. 연결되면 다시 시도해주세요',
  network: '연결이 불안정해요. 잠시 후 다시 시도해주세요',
  // 서버가 값을 거절한 것이라 같은 입력으로 다시 눌러도 결과가 같다. 백엔드 검증
  // 메시지는 class-validator 기본 영문이라 그대로 보여줄 수 없어 문구로만 안내한다.
  'server-rejected': '저장하지 못했어요. 입력한 내용을 확인해주세요',
  'server-unavailable': '일시적인 오류예요. 잠시 후 다시 시도해주세요',
  unknown: '저장에 실패했어요. 다시 시도해주세요',
};

export function mutationFailureMessage(error: unknown): string {
  return FAILURE_MESSAGE[classifyMutationFailure(error)];
}
