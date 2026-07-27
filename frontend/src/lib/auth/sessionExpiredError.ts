/**
 * 토큰 리프레시가 "서버가 거절해서" 실패했을 때 던진다. 사용자는 다시 로그인해야 한다.
 *
 * 네트워크 때문에 리프레시가 실패한 경우는 여기에 해당하지 않는다 — 세션은 아직
 * 살아 있을 수 있으므로 원래 네트워크 에러를 그대로 전파한다(`errorLink` 참고).
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
