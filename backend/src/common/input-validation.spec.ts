import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { UpdateNotificationPreferenceInput } from '../notification/notification.types';

// main.ts와 같은 설정. whitelist: true는 class-validator 데코레이터가 없는 필드를 지운다.
const pipe = new ValidationPipe({ whitelist: true, transform: true });

/**
 * GraphQL 입력 필드에 검증 데코레이터를 빠뜨리면, 그 필드는 에러 없이 요청에서 사라진다.
 * 서버는 200을 돌려주고 화면도 정상이라 "저장했는데 안 바뀐다"로만 나타난다. 실제로 알림 설정
 * 입력(UpdateNotificationPreferenceInput)이 그 상태로 출시돼 스위치가 한 번도 동작하지 않았다.
 */
describe('GraphQL 입력 검증', () => {
  it('알림 설정 입력이 ValidationPipe를 지나도 값이 남는다', async () => {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateNotificationPreferenceInput,
    };
    const result = await pipe.transform(
      { vaccinationDueEnabled: false, medicationReminderEnabled: false },
      metadata,
    );
    expect(result).toEqual({ vaccinationDueEnabled: false, medicationReminderEnabled: false });
  });

  // 같은 실수가 다른 입력 타입에서 반복되지 않게 소스를 훑는다. 정규식 검사라 완벽하지 않지만,
  // @Field만 있고 검증 데코레이터가 하나도 없는 필드라는 가장 흔한 형태는 잡는다.
  it('모든 @InputType 필드에 @Field 외의 검증 데코레이터가 하나 이상 있다', () => {
    const NON_VALIDATORS = new Set(['Field', 'ApiProperty', 'ApiPropertyOptional', 'Type']);
    const offenders: string[] = [];

    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return walk(path);
        return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
      });

    for (const file of walk(join(__dirname, '..'))) {
      const source = readFileSync(file, 'utf8');
      for (const cls of source.matchAll(
        /@InputType\([^)]*\)\s*export class (\w+)\s*\{([\s\S]*?)\n\}/g,
      )) {
        for (const field of cls[2].matchAll(
          /((?:\s*@\w+\([^;]*?\)\s*)+)\s*(\w+)[!?]?:\s*[^;]+;/g,
        )) {
          const decorators = [...field[1].matchAll(/@(\w+)/g)].map((m) => m[1]);
          if (!decorators.some((d) => !NON_VALIDATORS.has(d)))
            offenders.push(`${cls[1]}.${field[2]}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
