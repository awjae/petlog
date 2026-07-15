import { Logger, NotFoundException } from '@nestjs/common';
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

  it('GraphQLError가 아닌 값이 넘어오면(이례적 상황) 안전한 쪽으로 로그를 남긴다', () => {
    formatGraphQLError({ message: 'weird', path: ['weirdField'] }, 'not-a-graphql-error');

    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled GraphQL error at weirdField (non-GraphQLError value)',
      'not-a-graphql-error',
    );
  });
});
