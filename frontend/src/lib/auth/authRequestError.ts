/**
 * 인증 API가 비정상 응답을 돌려줬을 때 던진다.
 *
 * 상태 코드를 들고 다니는 이유는 "세션이 죽은 것"(401/403)과 "서버가 잠깐 이상한 것"
 * (5xx, 429)을 호출부가 구분해야 하기 때문이다. 전자만 로그아웃 사유다.
 *
 * 번들이 중복 로드돼도 판정이 깨지지 않게 `instanceof` 대신 name으로 확인한다.
 */
export class AuthRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Auth request failed: ${status}`);
    this.name = 'AuthRequestError';
    this.status = status;
  }

  static is(error: unknown): error is AuthRequestError {
    return error instanceof Error && error.name === 'AuthRequestError';
  }
}
