import { CombinedGraphQLErrors } from '@apollo/client';

/** NestJS 예외 필터가 GraphQL 에러 extensions에 실어 보내는 원본 HTTP 상태. */
function originalStatusCode(extensions: Record<string, unknown> | undefined): number | undefined {
  const originalError = extensions?.originalError as { statusCode?: number } | undefined;
  return originalError?.statusCode;
}

/**
 * NestJS GqlAuthGuard 인증 실패: HTTP 200 + errors[].extensions.code UNAUTHENTICATED
 *
 * errorLink(리프레시 트리거)와 실패 분류가 같은 기준을 써야 한다. 한쪽만 알면 리프레시
 * 이후에도 인증이 안 풀린 응답이 "저장에 실패했어요. 다시 시도해주세요"로 안내된다.
 */
export function isUnauthenticatedError(error: unknown): boolean {
  return (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' || originalStatusCode(err.extensions) === 401,
    )
  );
}

/**
 * 서버 내부 오류(5xx)가 GraphQL 에러로 실려 온 경우. 값이 잘못된 것(사용자가 고칠 수
 * 있음)과 서버가 고장난 것(기다려야 함)은 안내가 달라야 한다.
 */
export function isServerFaultError(error: unknown): boolean {
  return (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((err) => (originalStatusCode(err.extensions) ?? 0) >= 500)
  );
}
