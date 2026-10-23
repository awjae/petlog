import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VisitService, VISIT_RETENTION_DAYS } from './visit.service';
import { RecordVisitDto } from './dto/record-visit.dto';
import { PrismaService } from '../common/prisma/prisma.service';

describe('VisitService', () => {
  const now = new Date('2026-10-23T00:00:00Z');
  let prisma: { visitEvent: { create: jest.Mock; deleteMany: jest.Mock } };
  let service: VisitService;

  beforeEach(() => {
    prisma = {
      visitEvent: { create: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
    };
    service = new VisitService(prisma as unknown as PrismaService);
  });

  it('보존 기간(90일)보다 오래된 방문만 지운다', async () => {
    const count = await service.deleteExpired(now);

    const { where } = prisma.visitEvent.deleteMany.mock.calls[0][0];
    const expected = new Date(now.getTime() - VISIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    expect(where.createdAt.lt).toEqual(expected);
    expect(count).toBe(3);
  });

  it('방문 기록을 그대로 저장한다', async () => {
    await service.record({ path: '/guides', referrer: 'search.naver.com' });

    expect(prisma.visitEvent.create).toHaveBeenCalledWith({
      data: { path: '/guides', referrer: 'search.naver.com' },
    });
  });
});

describe('RecordVisitDto', () => {
  const check = (path: unknown) => validate(plainToInstance(RecordVisitDto, { path }));

  it.each(['/', '/guides/dog-weight-check'])('경로 %s는 통과한다', async (path) => {
    expect(await check(path)).toHaveLength(0);
  });

  it.each(['guides', 'https://evil.example/x', '/has space', '<script>', '', 123])(
    '경로 %p는 거부한다',
    async (path) => {
      expect((await check(path)).length).toBeGreaterThan(0);
    },
  );
});
