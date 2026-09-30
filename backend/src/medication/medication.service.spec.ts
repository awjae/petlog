import { MedicationService } from './medication.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';

describe('MedicationService.findActive', () => {
  afterEach(() => jest.useRealTimers());

  // 종료일 07-30은 2026-07-30T03:00:00Z(= KST 정오)로 저장된다. 그날 저녁에도 복용 중이어야 한다.
  it('종료일 당일 저녁(KST 18시)에도 그 약을 조회한다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-30T09:00:00Z'));
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new MedicationService(
      { medication: { findMany } } as unknown as PrismaService,
      { assertOwnership: jest.fn() } as unknown as PetService,
    );

    await service.findActive('user-1', 'pet-1');

    const { where } = findMany.mock.calls[0][0];
    const storedEndDate = new Date('2026-07-30T03:00:00Z');
    expect(where.OR[1].endDate.gte <= storedEndDate).toBe(true);
    expect(where.startDate.lt.toISOString()).toBe('2026-07-30T15:00:00.000Z');
  });
});
