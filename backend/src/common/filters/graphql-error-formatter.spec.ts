import { Logger, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';
import { formatGraphQLError } from './graphql-error-formatter';

describe('formatGraphQLError', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('서비스가 직접 던진 GraphQLError(비즈니스 규칙 위반)는 로그를 남기지 않는다', () => {
    const error = new GraphQLError('이번 달 리포트가 이미 존재합니다.', {
      extensions: { code: 'CONFLICT' },
    });

    const result = formatGraphQLError({ message: error.message, path: ['generateReport'] }, error);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(result.message).toBe('이번 달 리포트가 이미 존재합니다.');
  });

  it('Nest HttpException에서 비롯된 에러는 로그를 남기지 않는다', () => {
    const original = new NotFoundException('반려동물을 찾을 수 없습니다.');
    const error = new GraphQLError(original.message, { originalError: original });

    formatGraphQLError({ message: error.message, path: ['pet'] }, error);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('예기치 못한 에러(Prisma/TypeError 등)는 스택트레이스와 함께 로그를 남긴다', () => {
    const original = new TypeError('Cannot read properties of undefined');
    const error = new GraphQLError('Internal server error', { originalError: original });

    formatGraphQLError({ message: 'Internal server error', path: ['healthRecords'] }, error);

    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled GraphQL error at healthRecords',
      original.stack,
    );
  });

  // Apollo가 검증 실패를 ValidationError로 감쌀 때 originalError를 원본 GraphQLError로
  // 채우기 때문에(PETLOG-API-4), originalError 유무만으로는 요청자 귀책과 서버 버그를
  // 구분할 수 없다. 실제 Sentry에 올라왔던 introspection 차단 에러의 형태를 그대로 재현한다.
  it('Apollo가 감싼 검증 실패(요청자 귀책)는 로그를 남기지 않는다', () => {
    const validationError = new GraphQLError(
      'GraphQL introspection is not allowed by Apollo Server, but the query contained __schema or __type.',
    );
    const error = new GraphQLError(validationError.message, {
      originalError: validationError,
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    });

    formatGraphQLError({ message: error.message }, error);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('잘못된 쿼리 문법(파싱 실패)도 로그를 남기지 않는다', () => {
    const syntaxError = new GraphQLError('Syntax Error: Expected Name, found "}".');
    const error = new GraphQLError(syntaxError.message, {
      originalError: syntaxError,
      extensions: { code: 'GRAPHQL_PARSE_FAILED' },
    });

    formatGraphQLError({ message: error.message }, error);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('APQ 미스(PERSISTED_QUERY_NOT_FOUND)는 로그를 남기지 않는다', () => {
    const error = new GraphQLError('PersistedQueryNotFound', {
      extensions: { code: 'PERSISTED_QUERY_NOT_FOUND' },
    });

    formatGraphQLError({ message: error.message }, error);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('Rate limit 초과(ThrottlerException 429)는 로그를 남기지 않는다', () => {
    const original = new ThrottlerException();
    const error = new GraphQLError(original.message, { originalError: original });

    formatGraphQLError({ message: error.message, path: ['createHealthRecord'] }, error);

    expect(errorSpy).not.toHaveBeenCalled();
  });

  // 코드 기준 제외가 넓어질수록 진짜 서버 버그까지 삼킬 위험이 생긴다. Apollo는 응답용
  // formattedError에만 INTERNAL_SERVER_ERROR를 채우지만, 원본 error에 그 코드가 실려 와도
  // 제외 대상이 아님을 고정한다.
  it('INTERNAL_SERVER_ERROR 코드가 붙어 있어도 서버 에러는 그대로 로그를 남긴다', () => {
    const original = new TypeError('Cannot read properties of undefined');
    const error = new GraphQLError('Internal server error', {
      originalError: original,
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });

    formatGraphQLError({ message: 'Internal server error', path: ['report'] }, error);

    expect(errorSpy).toHaveBeenCalledWith('Unhandled GraphQL error at report', original.stack);
  });

  it('GraphQLError가 아닌 값이 넘어오면(이례적 상황) 안전한 쪽으로 로그를 남긴다', () => {
    formatGraphQLError({ message: 'weird', path: ['weirdField'] }, 'not-a-graphql-error');

    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled GraphQL error at weirdField (non-GraphQLError value)',
      'not-a-graphql-error',
    );
  });
});
