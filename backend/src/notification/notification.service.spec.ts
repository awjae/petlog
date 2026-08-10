import { NotificationService } from './notification.service';
import { PrismaService } from '../common/prisma/prisma.service';
import type { PushSender } from '@petlog/push';

// 서울 2026-07-30 00:30 (= UTC 2026-07-29 15:30). UTC 날짜는 아직 07-29다.
const SEOUL_DAWN = new Date('2026-07-29T15:30:00Z');

// 서울 07-30 00:00 / 07-31 00:00을 UTC로 표현한 값.
const KST_DAY_START = '2026-07-29T15:00:00.000Z';
const KST_DAY_END = '2026-07-30T15:00:00.000Z';

describe('NotificationService 당일 스캔 구간', () => {
  let service: NotificationService;
  let prisma: {
    vaccination: { findMany: jest.Mock };
    appointment: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      vaccination: { findMany: jest.fn().mockResolvedValue([]) },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new NotificationService(
      prisma as unknown as PrismaService,
      { send: jest.fn() } as unknown as PushSender,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 이 구간은 원래 "우연히" 맞았다 — 크론이 09:00 UTC(= 서울 18시)에 돌아서 UTC 날짜와
  // 서울 날짜가 같았기 때문이다. 크론을 서울 09시로 옮기면 UTC 날짜가 하루 전이 되므로
  // 그 시점에 깨질 상태였다. 이 테스트는 크론 시각과 무관하게 구간이 맞는지를 고정한다.
  it('접종 예정일 스캔이 서울 새벽에도 서울 기준 당일 구간을 쓴다', async () => {
    jest.useFakeTimers().setSystemTime(SEOUL_DAWN);

    await service.scanAndSendVaccinationDue();

    const { where } = prisma.vaccination.findMany.mock.calls[0][0];
    expect(where.nextDueAt.gte.toISOString()).toBe(KST_DAY_START);
    expect(where.nextDueAt.lt.toISOString()).toBe(KST_DAY_END);
  });

  it('병원 방문 스캔이 서울 새벽에도 서울 기준 당일 구간을 쓴다', async () => {
    jest.useFakeTimers().setSystemTime(SEOUL_DAWN);

    await service.scanAndSendAppointmentReminder();

    const { where } = prisma.appointment.findMany.mock.calls[0][0];
    expect(where.scheduledAt.gte.toISOString()).toBe(KST_DAY_START);
    expect(where.scheduledAt.lt.toISOString()).toBe(KST_DAY_END);
  });

  // 크론이 서울 09시로 옮겨진 뒤의 실제 실행 시각. 이때 UTC 날짜는 아직 07-29다.
  it('서울 09시(크론 실행 시각)에 실행해도 그날 예정 건을 조회한다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-30T00:00:00Z')); // 서울 09:00

    await service.scanAndSendVaccinationDue();

    const { where } = prisma.vaccination.findMany.mock.calls[0][0];
    expect(where.nextDueAt.gte.toISOString()).toBe(KST_DAY_START);

    // 클라이언트가 07-30 예정으로 저장한 값(로컬 정오 앵커)이 구간에 들어와야 한다.
    const dueOn0730 = new Date('2026-07-30T03:00:00Z');
    expect(dueOn0730 >= where.nextDueAt.gte && dueOn0730 < where.nextDueAt.lt).toBe(true);
  });
});

// 탈퇴를 요청하면 30일 그레이스 기간 동안 Pet과 PushToken이 그대로 남는다. 이때 스캔 조건에
// 계정 상태가 빠져 있으면 탈퇴한 사용자가 매일 아침 푸시를 계속 받는다.
describe('NotificationService 탈퇴 계정 제외', () => {
  let service: NotificationService;
  let prisma: {
    vaccination: { findMany: jest.Mock };
    appointment: { findMany: jest.Mock };
    pet: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      vaccination: { findMany: jest.fn().mockResolvedValue([]) },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      pet: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new NotificationService(
      prisma as unknown as PrismaService,
      { send: jest.fn() } as unknown as PushSender,
    );
  });

  it('접종 예정일 스캔이 탈퇴 요청한 계정의 pet을 조회하지 않는다', async () => {
    await service.scanAndSendVaccinationDue();

    const { where } = prisma.vaccination.findMany.mock.calls[0][0];
    expect(where.pet.user.deletionRequestedAt).toBeNull();
  });

  it('병원 방문 스캔이 탈퇴 요청한 계정의 pet을 조회하지 않는다', async () => {
    await service.scanAndSendAppointmentReminder();

    const { where } = prisma.appointment.findMany.mock.calls[0][0];
    expect(where.pet.user.deletionRequestedAt).toBeNull();
  });

  it('건강기록 권장 알림 스캔이 탈퇴 요청한 계정의 pet을 조회하지 않는다', async () => {
    await service.scanAndSendWeeklyCheckin();

    const { where } = prisma.pet.findMany.mock.calls[0][0];
    expect(where.deletedAt).toBeNull();
    expect(where.user.deletionRequestedAt).toBeNull();
  });
});
