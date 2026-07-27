import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PetService } from '../pet/pet.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { User } from './user.types';

/**
 * 이 프로젝트의 삭제는 전부 소프트 삭제다(deletedAt에 시각을 찍는다).
 * 그래서 조회하는 쪽마다 `deletedAt: null`을 빠뜨리지 않아야 하는데, 이건 타입으로
 * 강제되지 않고 빠뜨려도 아무 데서도 실패하지 않는다 — 화면에 "지웠는데 그대로 있는"
 * 상태로만 드러난다.
 *
 * 실제로 calendarEvents / upcomingSchedules의 조회 9개가 전부 이 필터를 빠뜨리고
 * 있었다(코드 리뷰에서 발견). 삭제한 반려동물과 기록이 캘린더와 홈 알림에 계속 보였다.
 *
 * 여기서는 where 절에 필터가 들어갔는지를 직접 확인한다. 이 계층의 책임은 "무엇을
 * 조회할지"이므로, 그 조건 자체를 검증 대상으로 본다.
 */
describe('UserResolver — 소프트 삭제 필터', () => {
  const user = { id: 'user-1' } as User;

  let prisma: {
    pet: { findMany: jest.Mock };
    healthRecord: { findMany: jest.Mock };
    vaccination: { findMany: jest.Mock };
    medication: { findMany: jest.Mock };
    appointment: { findMany: jest.Mock };
    medicalEvent: { findMany: jest.Mock };
  };
  let resolver: UserResolver;

  beforeEach(() => {
    prisma = {
      pet: { findMany: jest.fn().mockResolvedValue([{ id: 'pet-1', name: '초코' }]) },
      healthRecord: { findMany: jest.fn().mockResolvedValue([]) },
      vaccination: { findMany: jest.fn().mockResolvedValue([]) },
      medication: { findMany: jest.fn().mockResolvedValue([]) },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      medicalEvent: { findMany: jest.fn().mockResolvedValue([]) },
    };

    resolver = new UserResolver(
      {} as unknown as UserService,
      {} as unknown as PetService,
      prisma as unknown as PrismaService,
    );
  });

  /** 모든 findMany 호출의 where 절을 모은다. */
  function collectWhereClauses() {
    return Object.values(prisma)
      .flatMap((model) => model.findMany.mock.calls)
      .map(([args]) => (args as { where: Record<string, unknown> }).where);
  }

  describe('calendarEvents', () => {
    it('반려동물과 5종 이벤트 조회 모두에서 소프트 삭제된 행을 제외한다', async () => {
      await resolver.calendarEvents(user, '2026-07-01', '2026-07-31');

      const wheres = collectWhereClauses();
      expect(wheres).toHaveLength(6); // pet + healthRecord/vaccination/medication/appointment/medicalEvent
      for (const where of wheres) {
        expect(where).toMatchObject({ deletedAt: null });
      }
    });

    it('삭제된 반려동물은 조회 대상에서 빠지므로 그 기록도 따라 나오지 않는다', async () => {
      await resolver.calendarEvents(user, '2026-07-01', '2026-07-31');

      expect(prisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', deletedAt: null } }),
      );
    });
  });

  describe('upcomingSchedules', () => {
    it('반려동물과 3종 일정 조회 모두에서 소프트 삭제된 행을 제외한다', async () => {
      await resolver.upcomingSchedules(user, 3);

      const wheres = collectWhereClauses();
      expect(wheres).toHaveLength(4); // pet + vaccination/medication/appointment
      for (const where of wheres) {
        expect(where).toMatchObject({ deletedAt: null });
      }
    });
  });
});
