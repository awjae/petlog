import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

/**
 * 로그인 시도 제한. 데코레이터가 붙었는지가 아니라 실제 HTTP 요청이 429로 막히는지 본다 —
 * ThrottlerGuard를 빠뜨리고 @Throttle만 남기면 아무 일도 일어나지 않는데 코드로는 멀쩡해 보인다.
 */
describe('AuthController 시도 제한', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn().mockRejectedValue(new UnauthorizedException()),
            create: jest.fn().mockRejectedValue(new UnauthorizedException()),
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(() => app.close());

  async function post(path: string, body: unknown): Promise<number> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.status;
  }

  it('틀린 비밀번호로 1분에 10번까지는 401, 11번째부터는 429다', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push(await post('/auth/login', { email: 'a@petlog.test', password: 'wrong-pass' }));
    }
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses[10]).toBe(429);
  });

  it('회원가입은 1분에 10번까지 받는다', async () => {
    const body = {
      email: 'b@petlog.test',
      password: 'password123',
      consents: { termsOfService: true, privacyPolicy: true, marketingNotification: false },
    };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push(await post('/auth/register', body));
    expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
