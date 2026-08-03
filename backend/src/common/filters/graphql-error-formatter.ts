import { HttpException, Logger } from '@nestjs/common';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import * as Sentry from '@sentry/node';

const logger = new Logger('GraphQLExceptionFilter');

// 이미 성격이 판정된 에러인가 — 즉 서버 에러로 기록하지 않아도 되는가.
//
// 판정 근거는 둘이다.
//   1. originalError가 Nest 예외다.
//      가드/서비스의 검증 실패이고 ThrottlerGuard의 429도 여기 속한다. Nest 예외는
//      GraphQLError가 아니라 extensions가 없으므로 2번으로는 걸러지지 않는다.
//   2. extensions.code가 있다.
//      Apollo나 우리 서비스가 이 에러를 이미 분류했다는 뜻이다. Apollo의 파싱/검증/변수
//      강제변환 실패(GRAPHQL_VALIDATION_FAILED 등)와 report.service.ts의 도메인 규칙
//      위반(CONFLICT, UNPROCESSABLE_ENTITY 등)이 모두 여기 해당하고 전부 4xx로 끝난다.
//      분류되지 않은 에러(code 없음)만이 정체불명의 서버 버그다. 단 INTERNAL_SERVER_ERROR는
//      "서버 잘못"이라는 분류이므로 기록 대상으로 남긴다.
//
// originalError 유무는 기준이 될 수 없다(PETLOG-API-4). graphql-js의 locatedError가
// 리졸버 에러를 새 GraphQLError로 감싸며 채우고(graphql/error/locatedError.js), Apollo도
// 리졸버 실행 전 단계의 실패를 감싸며 채우기 때문에(@apollo/server internalErrorClasses)
// 사실상 항상 존재한다.
function isAlreadyClassified(error: GraphQLError): boolean {
  if (error.originalError instanceof HttpException) {
    return true;
  }

  const code = error.extensions?.code;

  return typeof code === 'string' && code !== ApolloServerErrorCode.INTERNAL_SERVER_ERROR;
}

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

  if (isAlreadyClassified(error)) {
    return formattedError;
  }

  // captureException(undefined)를 막는 안전장치. originalError가 비는 건 Apollo가 원본
  // 없이 직접 만든 에러(BadRequestError 등)뿐이고, 그건 code를 갖고 있어 위에서 걸러진다.
  const { originalError } = error;
  if (originalError === undefined) {
    return formattedError;
  }

  logger.error(
    `Unhandled GraphQL error at ${path}`,
    originalError instanceof Error ? originalError.stack : String(originalError),
  );
  Sentry.captureException(originalError);

  return formattedError;
}
