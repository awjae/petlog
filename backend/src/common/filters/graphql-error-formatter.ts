import { HttpException, Logger } from '@nestjs/common';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';

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
    return formattedError;
  }

  // originalError가 없으면 리졸버/서비스가 GraphQLError를 직접 던진 것(report.service.ts의
  // 정책 위반 등 의도된 비즈니스 규칙 위반)이다. HttpException이면 Nest 가드/서비스의
  // 검증 실패다. 둘 다 정상적인 처리 흐름이라 REST의 HttpExceptionFilter와 동일한
  // 기준으로 로그 대상에서 제외한다.
  const { originalError } = error;
  if (originalError === undefined || originalError instanceof HttpException) {
    return formattedError;
  }

  logger.error(
    `Unhandled GraphQL error at ${path}`,
    originalError instanceof Error ? originalError.stack : String(originalError),
  );

  return formattedError;
}
