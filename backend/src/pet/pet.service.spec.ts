import { PetService } from './pet.service';
import { PrismaService } from '../common/prisma/prisma.service';

const PET_ID = 'pet-1';

// 서울 2026-07-30 00:30 (= UTC 2026-07-29 15:30).
// 컨테이너 TZ가 UTC라 이 시각의 UTC 날짜는 아직 07-29다. 여기서 "오늘"을 UTC 기준으로
// 잡으면 사용자가 보는 오늘(07-30)과 하루 어긋난다.
const SEOUL_DAWN = new Date('2026-07-29T15:30:00Z');

// 클라이언트는 로컬 날짜 D를 D 12:00(KST) = D 03:00Z로 저장한다.
// 사용자가 07-30에 남긴 기록이 이 인스턴트다.
const RECORD_MADE_TODAY = new Date('2026-07-30T03:00:00Z');
// 07-29(사용자 기준 어제)에 남긴 기록.
const RECORD_MADE_YESTERDAY = new Date('2026-07-29T03:00:00Z');

describe('PetService', () => {
  let service: PetService;
  let prisma: { healthRecord: { count: jest.Mock } };

  beforeEach(() => {
    prisma = { healthRecord: { count: jest.fn().mockResolvedValue(0) } };
    service = new PetService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('countTodayRecords', () => {
    // 회귀 대상 버그: KST 00~09시에는 오늘 남긴 기록이 집계에서 빠지고,
    // 대신 어제 기록이 오늘로 잡혔다. 홈 화면 todayRecordCount에 그대로 노출됐다.
    it('서울 새벽에도 서울 기준 오늘 구간으로 조회한다', async () => {
      jest.useFakeTimers().setSystemTime(SEOUL_DAWN);

      await service.countTodayRecords(PET_ID);

      const { where } = prisma.healthRecord.count.mock.calls[0][0];
      // 서울 07-30 00:00 = UTC 07-29 15:00 / 07-31 00:00 = UTC 07-30 15:00
      expect(where.recordedAt.gte.toISOString()).toBe('2026-07-29T15:00:00.000Z');
      expect(where.recordedAt.lt.toISOString()).toBe('2026-07-30T15:00:00.000Z');
    });

    it('서울 새벽에 조회해도 오늘 남긴 기록이 구간에 포함된다', async () => {
      jest.useFakeTimers().setSystemTime(SEOUL_DAWN);

      await service.countTodayRecords(PET_ID);

      const { where } = prisma.healthRecord.count.mock.calls[0][0];
      const { gte, lt } = where.recordedAt;

      // 버그가 있던 UTC 구간([07-29T00:00Z, 07-30T00:00Z))에서는 이 단정이 깨진다.
      expect(RECORD_MADE_TODAY >= gte && RECORD_MADE_TODAY < lt).toBe(true);
      expect(RECORD_MADE_YESTERDAY >= gte && RECORD_MADE_YESTERDAY < lt).toBe(false);
    });

    it('서울 정오에는 같은 구간을 쓴다', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-30T03:00:00Z')); // 서울 12:00

      await service.countTodayRecords(PET_ID);

      const { where } = prisma.healthRecord.count.mock.calls[0][0];
      expect(where.recordedAt.gte.toISOString()).toBe('2026-07-29T15:00:00.000Z');
      expect(where.recordedAt.lt.toISOString()).toBe('2026-07-30T15:00:00.000Z');
    });

    it('삭제된 기록은 세지 않는다', async () => {
      jest.useFakeTimers().setSystemTime(SEOUL_DAWN);

      await service.countTodayRecords(PET_ID);

      const { where } = prisma.healthRecord.count.mock.calls[0][0];
      expect(where).toMatchObject({ petId: PET_ID, deletedAt: null });
    });
  });
});
