/**
 * 토큰 리프레시를 서버가 명시적으로 거절했을 때 던진다. 사용자는 다시 로그인해야 한다.
 *
 * 연결 실패나 서버 장애로 리프레시가 실패한 경우는 여기 해당하지 않는다 — 세션이
 * 살아 있는지 알 수 없을 뿐이므로 세션을 유지한다(`errorLink` 참고).
 *
 * 번들이 중복 로드돼도 판정이 깨지지 않게 `instanceof` 대신 name으로 확인한다.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }

  static is(error: unknown): error is SessionExpiredError {
    return error instanceof Error && error.name === 'SessionExpiredError';
  }
}
