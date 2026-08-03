import { HttpException, Logger } from '@nestjs/common';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import * as Sentry from '@sentry/node';

const logger = new Logger('GraphQLExceptionFilter');

// Apollo는 리졸버 실행 전(파싱/검증/변수 강제변환) 단계의 실패를 자체 에러 클래스로 감싸면서
// `originalError: graphqlError.originalError ?? graphqlError`로 originalError를 항상 채운다
// (@apollo/server internalErrorClasses). 그래서 아래 originalError 기준만으로는 이들을
// 걸러내지 못하고, 400으로 끝나는 요청자 귀책(오타난 필드명, 구버전 번들이 보낸 옛 쿼리,
// 봇의 introspection 시도)까지 서버 미처리 예외로 집계된다. 코드 기준으로 명시적으로 제외한다.
const CLIENT_FAULT_CODES: ReadonlySet<string> = new Set([
  ApolloServerErrorCode.GRAPHQL_PARSE_FAILED,
  ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
  ApolloServerErrorCode.BAD_USER_INPUT,
  ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE,
  ApolloServerErrorCode.BAD_REQUEST,
]);

// REST 쪽 HttpExceptionFilter는 host.getType() !== 'http'인 요청(GraphQL 전부)을
// 그냥 건너뛴다. Apollo Driver는 그 필터와 별개의 실행 경로라, 리졸버(도메인 API의
// 대부분)에서 터진 예기치 못한 예외는 지금까지 서버 어디에도 로그가 남지 않았다.
// formatError는 응답이 나가기 직전 모든 GraphQL 에러를 거치므로 그 공백을 메운다.
export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const path = formattedError.path?.join('.') ?? 'unknown path';

  // graphql-js는 실행 중 잡힌 에러를 항상 GraphQLError로 감싸는 게 정상이다. 그렇지
  // 않은 값이 넘어오는 건 그 자체로 이례적인 상황이라, REST 필터의 "모르면 로그를
  // 남긴다" 기준과 동일하게 안전한 쪽(로그)으로 처리한다.
  if (!(error instanceof GraphQLError)) {
    logger.error(`Unhandled GraphQL error at ${path} (non-GraphQLError value)`, String(error));
    Sentry.captureException(error);
    return formattedError;
  }

  // originalError가 없으면 리졸버/서비스가 GraphQLError를 직접 던진 것(report.service.ts의
  // 정책 위반 등 의도된 비즈니스 규칙 위반)이다. HttpException이면 Nest 가드/서비스의
  // 검증 실패다. 둘 다 정상적인 처리 흐름이라 REST의 HttpExceptionFilter와 동일한
  // 기준으로 로그 대상에서 제외한다.
  const code = error.extensions?.code;
  if (typeof code === 'string' && CLIENT_FAULT_CODES.has(code)) {
    return formattedError;
  }

  const { originalError } = error;
  if (originalError === undefined || originalError instanceof HttpException) {
    return formattedError;
  }

  logger.error(
    `Unhandled GraphQL error at ${path}`,
    originalError instanceof Error ? originalError.stack : String(originalError),
  );
  Sentry.captureException(originalError);

  return formattedError;
}
