import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AuthController } from './auth.controller';
import { TRUST_PROXY_HOPS } from '../common/trust-proxy';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

/**
 * 로그인 시도 제한. 데코레이터가 붙었는지가 아니라 실제 HTTP 요청이 429로 막히는지 본다 —
 * ThrottlerGuard를 빠뜨리고 @Throttle만 남기면 아무 일도 일어나지 않는데 코드로는 멀쩡해 보인다.
 */
describe('AuthController 시도 제한', () => {
  let app: NestExpressApplication;
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
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', TRUST_PROXY_HOPS);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(() => app.close());

  // 운영과 같은 헤더 모양: CloudFront가 사용자 IP를 넣고, ALB가 CloudFront 엣지 IP를 덧붙인다.
  // 이 테스트의 소켓 상대(localhost)가 ALB 자리다. 테스트마다 다른 사용자 IP를 써서 카운터를 나눈다.
  async function post(path: string, body: unknown, userIp: string): Promise<number> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `${userIp}, 130.176.0.1` },
      body: JSON.stringify(body),
    });
    return res.status;
  }

  const wrongLogin = { email: 'a@petlog.test', password: 'wrong-pass' };

  it('틀린 비밀번호로 1분에 10번까지는 401, 11번째부터는 429다', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++)
      statuses.push(await post('/auth/login', wrongLogin, '203.0.113.1'));
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses[10]).toBe(429);
  });

  it('같은 CloudFront 엣지를 거쳐도 사용자 IP가 다르면 따로 센다', async () => {
    for (let i = 0; i < 10; i++) await post('/auth/login', wrongLogin, '203.0.113.2');
    expect(await post('/auth/login', wrongLogin, '203.0.113.2')).toBe(429);
    expect(await post('/auth/login', wrongLogin, '203.0.113.3')).toBe(401);
  });

  it('회원가입은 1분에 10번까지 받는다', async () => {
    const body = {
      email: 'b@petlog.test',
      password: 'password123',
      consents: { termsOfService: true, privacyPolicy: true, marketingNotification: false },
    };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push(await post('/auth/register', body, '203.0.113.4'));
    expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
