import { HttpException, Logger } from '@nestjs/common';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import * as Sentry from '@sentry/node';

const logger = new Logger('GraphQLExceptionFilter');

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

  // code가 붙어 있다는 건 Apollo나 우리 서비스가 이 에러를 이미 분류했다는 뜻이다.
  // Apollo의 파싱/검증/변수 강제변환 실패(GRAPHQL_VALIDATION_FAILED 등)와 report.service.ts가
  // 던지는 도메인 규칙 위반(CONFLICT, UNPROCESSABLE_ENTITY 등)이 모두 여기 해당하고, 전부
  // 4xx로 끝나는 정상적인 거절이다. 반대로 분류되지 않은 에러(code 없음)만이 정체불명의
  // 서버 버그다. INTERNAL_SERVER_ERROR는 "서버 잘못"이라는 분류이므로 리포트 대상으로 남긴다.
  //
  // originalError 유무로는 이 구분을 할 수 없다. graphql-js의 locatedError는 path가 없는
  // 에러를 새 GraphQLError로 감싸며 originalError를 채우고(graphql/error/locatedError.js),
  // Apollo도 리졸버 실행 전 단계의 실패를 감싸며 originalError를 채운다
  // (@apollo/server internalErrorClasses). 그래서 리졸버가 던진 에러든 Apollo가 만든
  // 에러든 originalError는 사실상 항상 존재한다.
  const code = error.extensions?.code;
  if (typeof code === 'string' && code !== ApolloServerErrorCode.INTERNAL_SERVER_ERROR) {
    return formattedError;
  }

  // Nest 예외는 GraphQLError가 아니라 extensions가 없어 code로는 걸러지지 않는다.
  // ThrottlerGuard의 429도 여기 포함된다. REST의 HttpExceptionFilter와 동일한 기준으로
  // 정상적인 처리 흐름으로 보고 제외한다.
  //
  // originalError가 비는 건 Apollo가 원본 없이 직접 만든 에러(BadRequestError 등)뿐이고
  // 그건 code를 갖고 있어 위에서 이미 걸러진다. 여기서는 captureException(undefined)를
  // 막는 안전장치로만 남는다.
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
