import { Scalar, CustomScalar } from '@nestjs/graphql';
import { GraphQLError, Kind, ValueNode } from 'graphql';

// new Date()는 파싱할 수 없는 문자열에도 예외를 던지지 않고 Invalid Date를 돌려준다.
// 그대로 통과시키면 리졸버까지 Invalid Date가 흘러가고, 응답을 만들 때 serialize의
// toISOString()이 RangeError로 터진다. 요청자가 날짜 형식을 틀렸을 뿐인데 500이 나가고
// Sentry에는 서버 에러로 쌓이므로, 값이 들어오는 경계에서 거절한다.
function parseISODateTime(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError(`DateTime 형식이 올바르지 않습니다: ${value}`);
  }

  return date;
}

@Scalar('DateTime', () => Date)
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = 'ISO 8601 DateTime';

  serialize(value: unknown): string {
    return (value as Date).toISOString();
  }

  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new GraphQLError('DateTime은 ISO 8601 문자열이어야 합니다.');
    }

    return parseISODateTime(value);
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('DateTime은 ISO 8601 문자열이어야 합니다.', { nodes: ast });
    }

    return parseISODateTime(ast.value);
  }
}
