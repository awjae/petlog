import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLSchema,
  graphql,
  Kind,
  type ValueNode,
} from 'graphql';
import { DateTimeScalar } from './datetime.scalar';

const scalar = new DateTimeScalar();

const literal = (value: string): ValueNode => ({ kind: Kind.STRING, value });

describe('DateTimeScalar', () => {
  describe('parseValue (변수로 전달된 값)', () => {
    it('ISO 8601 문자열을 Date로 변환한다', () => {
      expect(scalar.parseValue('2026-08-03T10:00:00.000Z')).toEqual(
        new Date('2026-08-03T10:00:00.000Z'),
      );
    });

    it('파싱할 수 없는 문자열은 거절한다', () => {
      expect(() => scalar.parseValue('garbage-not-a-date')).toThrow(
        'DateTime 형식이 올바르지 않습니다: garbage-not-a-date',
      );
    });

    it('문자열이 아닌 값은 거절한다', () => {
      expect(() => scalar.parseValue(123)).toThrow('DateTime은 ISO 8601 문자열이어야 합니다.');
    });
  });

  describe('parseLiteral (쿼리에 직접 쓴 리터럴)', () => {
    it('ISO 8601 문자열 리터럴을 Date로 변환한다', () => {
      expect(scalar.parseLiteral(literal('2026-08-03T10:00:00.000Z'))).toEqual(
        new Date('2026-08-03T10:00:00.000Z'),
      );
    });

    it('파싱할 수 없는 문자열 리터럴은 거절한다', () => {
      expect(() => scalar.parseLiteral(literal('garbage-not-a-date'))).toThrow(
        'DateTime 형식이 올바르지 않습니다',
      );
    });

    it('문자열이 아닌 리터럴은 거절한다', () => {
      expect(() => scalar.parseLiteral({ kind: Kind.INT, value: '123' })).toThrow(
        'DateTime은 ISO 8601 문자열이어야 합니다.',
      );
    });
  });

  // 단위 검증만으로는 이 버그의 증상(요청자 잘못인데 500이 나간다)을 잡지 못한다.
  // Invalid Date는 parseValue를 조용히 통과한 뒤 응답을 만드는 serialize 단계에서
  // RangeError로 터졌기 때문에, 실제 실행 경로로 확인해야 회귀를 막을 수 있다.
  describe('GraphQL 실행 경로', () => {
    const DateTime = new GraphQLScalarType({
      name: 'DateTime',
      serialize: (value) => scalar.serialize(value),
      parseValue: (value) => scalar.parseValue(value),
      parseLiteral: (ast) => scalar.parseLiteral(ast),
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          echo: {
            type: DateTime,
            args: { at: { type: DateTime } },
            resolve: (_source, { at }: { at: Date }) => at,
          },
        },
      }),
    });

    it('변수로 잘못된 날짜를 보내면 serialize까지 가지 않고 거절된다', async () => {
      const result = await graphql({
        schema,
        source: 'query ($at: DateTime) { echo(at: $at) }',
        variableValues: { at: 'garbage-not-a-date' },
      });

      expect(result.errors?.[0].message).toContain('DateTime 형식이 올바르지 않습니다');
      // Invalid Date가 흘러갔다면 serialize의 toISOString()이 RangeError로 터진다.
      expect(result.errors?.[0].message).not.toContain('Invalid time value');
    });

    it('유효한 날짜는 변수 경로로 정상 왕복한다', async () => {
      const result = await graphql({
        schema,
        source: 'query ($at: DateTime) { echo(at: $at) }',
        variableValues: { at: '2026-08-03T10:00:00.000Z' },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.echo).toBe('2026-08-03T10:00:00.000Z');
    });
  });
});
