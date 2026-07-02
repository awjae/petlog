import { CombinedGraphQLErrors } from '@apollo/client';

// NestJS 기본 GraphQL 에러 포맷: HttpException(NotFoundException 등)은
// extensions.originalError.statusCode 로 원본 HTTP 상태 코드를 담는다.
export function isNotFoundError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some(
    (err) =>
      (err.extensions?.originalError as { statusCode?: number } | undefined)?.statusCode === 404,
  );
}
