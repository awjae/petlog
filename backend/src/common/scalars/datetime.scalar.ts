import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime', () => Date)
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = 'ISO 8601 DateTime';

  serialize(value: unknown): string {
    return (value as Date).toISOString();
  }

  parseValue(value: unknown): Date {
    return new Date(value as string);
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    throw new Error('DateTime은 ISO 8601 문자열이어야 합니다.');
  }
}
