import { HttpException, NotFoundException } from '@nestjs/common';
import { findOwnedOrThrow } from './ownership';
import { PrismaService } from './prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { HealthRecordService } from '../health-record/health-record.service';
import { VaccinationService } from '../vaccination/vaccination.service';
import { MedicationService } from '../medication/medication.service';
import { AppointmentService } from '../appointment/appointment.service';
import { MedicalEventService } from '../medical-event/medical-event.service';
import { ReportService } from '../report/report.service';
import type { HealthReportGenerator } from '../ai/health-report-generator.interface';

const USER_ID = 'user-1';
const ID = 'row-1';

describe('findOwnedOrThrow', () => {
  it('id와 소유자를 함께 걸어 조회한다', async () => {
    const delegate = { findFirst: jest.fn().mockResolvedValue({ id: ID }) };

    const row = await findOwnedOrThrow(delegate, USER_ID, ID, '없습니다.');

    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, pet: { userId: USER_ID } },
    });
    expect(row).toEqual({ id: ID });
  });

  it('행이 없으면 NotFoundException을 던진다', async () => {
    const delegate = { findFirst: jest.fn().mockResolvedValue(null) };

    await expect(
      findOwnedOrThrow(delegate, USER_ID, ID, '기록을 찾을 수 없습니다.'),
    ).rejects.toThrow(new NotFoundException('기록을 찾을 수 없습니다.'));
  });
});

/**
 * 남의 리소스에 접근했을 때 403을 주면 "그 id는 존재한다"는 사실이 새어나간다.
 * id를 바꿔가며 찔러보면 남의 기록이 몇 개인지 셀 수 있으므로, 존재하지 않는 것과
 * 권한이 없는 것을 구분하지 않고 전 도메인이 404로 답한다.
 *
 * 통일 전에는 PetService만 403이었다. 그래서 pet만 다른 도메인과 달리 존재 여부가
 * 노출됐다. 도메인이 늘어날 때 이 규칙이 다시 갈라지지 않도록 한 자리에서 고정한다.
 */
describe('소유권 검증 실패는 전 도메인이 404', () => {
  function notFoundPrisma() {
    const model = () => ({
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    });
    return {
      pet: model(),
      healthRecord: model(),
      vaccination: model(),
      medication: model(),
      appointment: model(),
      medicalEvent: model(),
      report: model(),
    };
  }

  // 각 도메인에서 "소유권 검증을 거치는 대표 경로"를 실제로 호출한다.
  // private assertOwnership을 직접 찌르지 않고 공개 메서드를 통해 확인한다.
  function ownershipPaths() {
    const prisma = notFoundPrisma() as unknown as PrismaService;
    const petService = new PetService(prisma);
    const generator = { kind: 'mock', generate: jest.fn() } as unknown as HealthReportGenerator;

    return [
      ['pet', () => petService.assertOwnership(USER_ID, ID)],
      ['healthRecord', () => new HealthRecordService(prisma, petService).remove(USER_ID, ID)],
      ['vaccination', () => new VaccinationService(prisma, petService).remove(USER_ID, ID)],
      ['medication', () => new MedicationService(prisma, petService).remove(USER_ID, ID)],
      ['appointment', () => new AppointmentService(prisma, petService).remove(USER_ID, ID)],
      ['medicalEvent', () => new MedicalEventService(prisma, petService).remove(USER_ID, ID)],
      ['report', () => new ReportService(prisma, petService, generator).findOne(USER_ID, ID)],
    ] as const;
  }

  it.each(ownershipPaths())('%s — 남의 리소스에 403이 아니라 404로 답한다', async (_name, call) => {
    let thrown: unknown;
    await call().catch((e: unknown) => {
      thrown = e;
    });

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(404);
  });
});
