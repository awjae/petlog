import { HttpException, Logger } from '@nestjs/common';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import * as Sentry from '@sentry/node';

const logger = new Logger('GraphQLExceptionFilter');

// Apollo가 부여하는 코드 중 INTERNAL_SERVER_ERROR만 서버 귀책이고 나머지는 전부 "요청이
// 잘못됐다"는 뜻이다. 4xx로 끝나는 정상적인 거절이라 서버 에러로 집계하지 않는다.
//
// 아래 originalError 기준만으로 걸러지지 않는다. Apollo는 리졸버 실행 전(파싱/검증/변수
// 강제변환) 단계의 실패를 자체 에러 클래스로 감싸면서 `originalError: graphqlError.originalError
// ?? graphqlError`로 originalError를 항상 채우기 때문에(@apollo/server internalErrorClasses),
// 오타난 필드명이나 구버전 번들이 보낸 옛 쿼리, 봇의 introspection 시도가 전부 예기치 못한
// 서버 예외로 분류됐다.
//
// 리졸버 실행 중 터진 진짜 서버 버그에는 이 코드들이 붙지 않는다. graphql-js는 리졸버 에러를
// 감쌀 때 code를 부여하지 않고, Apollo가 INTERNAL_SERVER_ERROR를 채우는 대상은 응답용
// formattedError라서 여기서 보는 원본 error에는 영향이 없다(errorNormalize.js enrichError).
const CLIENT_FAULT_CODES: ReadonlySet<string> = new Set([
  ApolloServerErrorCode.GRAPHQL_PARSE_FAILED,
  ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
  ApolloServerErrorCode.BAD_USER_INPUT,
  ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE,
  ApolloServerErrorCode.BAD_REQUEST,
  ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND,
  ApolloServerErrorCode.PERSISTED_QUERY_NOT_SUPPORTED,
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

  const code = error.extensions?.code;
  if (typeof code === 'string' && CLIENT_FAULT_CODES.has(code)) {
    return formattedError;
  }

  // originalError가 없으면 리졸버/서비스가 GraphQLError를 직접 던진 것(report.service.ts의
  // 정책 위반 등 의도된 비즈니스 규칙 위반)이다. HttpException이면 Nest 가드/서비스의
  // 검증 실패이고, 여기에는 ThrottlerGuard의 429도 포함된다. 둘 다 정상적인 처리 흐름이라
  // REST의 HttpExceptionFilter와 동일한 기준으로 로그 대상에서 제외한다.
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
