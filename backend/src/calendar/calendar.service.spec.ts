import { CalendarService } from './calendar.service';
import { CalendarEventType, ScheduleType } from './calendar.types';
import { PetService } from '../pet/pet.service';
import { HealthRecordService } from '../health-record/health-record.service';
import { VaccinationService } from '../vaccination/vaccination.service';
import { MedicationService } from '../medication/medication.service';
import { AppointmentService } from '../appointment/appointment.service';
import { MedicalEventService } from '../medical-event/medical-event.service';
import { PrismaService } from '../common/prisma/prisma.service';

const pet = (id: string, name: string, profileImageUrl: string | null = null) => ({
  id,
  name,
  profileImageUrl,
});

describe('CalendarService 조합', () => {
  let service: CalendarService;
  let petService: { findAll: jest.Mock };
  let healthRecordService: { findByPetsInRange: jest.Mock };
  let vaccinationService: { findByPetsInRange: jest.Mock; findDueAfter: jest.Mock };
  let medicationService: { findByPetsInRange: jest.Mock; findEndingAfter: jest.Mock };
  let appointmentService: { findByPetsInRange: jest.Mock; findScheduledAfter: jest.Mock };
  let medicalEventService: { findByPetsInRange: jest.Mock };

  beforeEach(() => {
    petService = { findAll: jest.fn().mockResolvedValue([pet('pet-1', '초코')]) };
    healthRecordService = { findByPetsInRange: jest.fn().mockResolvedValue([]) };
    vaccinationService = {
      findByPetsInRange: jest.fn().mockResolvedValue([]),
      findDueAfter: jest.fn().mockResolvedValue([]),
    };
    medicationService = {
      findByPetsInRange: jest.fn().mockResolvedValue([]),
      findEndingAfter: jest.fn().mockResolvedValue([]),
    };
    appointmentService = {
      findByPetsInRange: jest.fn().mockResolvedValue([]),
      findScheduledAfter: jest.fn().mockResolvedValue([]),
    };
    medicalEventService = { findByPetsInRange: jest.fn().mockResolvedValue([]) };

    service = new CalendarService(
      petService as unknown as PetService,
      healthRecordService as unknown as HealthRecordService,
      vaccinationService as unknown as VaccinationService,
      medicationService as unknown as MedicationService,
      appointmentService as unknown as AppointmentService,
      medicalEventService as unknown as MedicalEventService,
    );
  });

  /**
   * 소유권과 소프트 삭제를 거르는 지점이 PetService.findAll 한 곳뿐이라는 것이 이 구조의
   * 전제다. 도메인 조회들은 여기서 나온 petIds만 받으므로, 남의 pet이나 삭제된 pet이
   * 목록에 섞이지 않는 한 그 기록도 따라 나올 수 없다.
   */
  it('모든 도메인 조회가 PetService가 내려준 petIds만 받는다', async () => {
    petService.findAll.mockResolvedValue([pet('pet-1', '초코'), pet('pet-2', '나비')]);

    await service.getCalendarEvents('user-1', '2026-07-01', '2026-07-31');

    expect(petService.findAll).toHaveBeenCalledWith('user-1');
    const expected = ['pet-1', 'pet-2'];
    expect(healthRecordService.findByPetsInRange).toHaveBeenCalledWith(
      expected,
      expect.any(Date),
      expect.any(Date),
    );
    for (const fn of [
      vaccinationService.findByPetsInRange,
      medicationService.findByPetsInRange,
      appointmentService.findByPetsInRange,
      medicalEventService.findByPetsInRange,
    ]) {
      expect(fn).toHaveBeenCalledWith(expected, expect.any(Date), expect.any(Date));
    }
  });

  it('반려동물이 없으면 빈 petIds로 조회하고 빈 목록을 돌려준다', async () => {
    petService.findAll.mockResolvedValue([]);

    const events = await service.getCalendarEvents('user-1', '2026-07-01', '2026-07-31');

    expect(events).toEqual([]);
    expect(healthRecordService.findByPetsInRange).toHaveBeenCalledWith(
      [],
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('여러 도메인의 이벤트를 날짜순으로 합친다', async () => {
    healthRecordService.findByPetsInRange.mockResolvedValue([
      {
        id: 'hr-1',
        petId: 'pet-1',
        type: 'weight',
        recordedAt: new Date('2026-07-20T03:00:00Z'),
        numValue: 4.2,
        textValue: null,
      },
    ]);
    vaccinationService.findByPetsInRange.mockResolvedValue([
      {
        id: 'v-1',
        petId: 'pet-1',
        name: '종합백신',
        code: 'DHPPL',
        vaccinatedAt: new Date('2026-07-05T03:00:00Z'),
      },
    ]);

    const events = await service.getCalendarEvents('user-1', '2026-07-01', '2026-07-31');

    expect(events.map((e) => e.date)).toEqual(['2026-07-05', '2026-07-20']);
    expect(events[0]).toMatchObject({ type: CalendarEventType.vaccination, subtitle: 'DHPPL' });
    // 건강 기록의 표시 라벨은 종류 이름까지만 만들고, 값 표기는 프론트가 조립한다.
    expect(events[1]).toMatchObject({
      type: CalendarEventType.health_record,
      title: '체중',
      recordType: 'weight',
      numValue: 4.2,
    });
  });

  it('다가오는 일정에 반려동물 이름과 프로필 이미지를 채운다', async () => {
    petService.findAll.mockResolvedValue([pet('pet-1', '초코', 'https://img/choco.png')]);
    vaccinationService.findDueAfter.mockResolvedValue([
      { id: 'v-1', petId: 'pet-1', name: '광견병', nextDueAt: new Date('2026-08-01T00:00:00Z') },
    ]);

    const [schedule] = await service.getUpcomingSchedules('user-1', 3);

    expect(schedule).toMatchObject({
      petName: '초코',
      petProfileImageUrl: 'https://img/choco.png',
      type: ScheduleType.vaccination,
      title: '광견병',
    });
  });

  it('다가오는 일정을 날짜순으로 정렬하고 limit만큼 자른다', async () => {
    vaccinationService.findDueAfter.mockResolvedValue([
      { id: 'v-1', petId: 'pet-1', name: '광견병', nextDueAt: new Date('2026-08-10T00:00:00Z') },
    ]);
    medicationService.findEndingAfter.mockResolvedValue([
      {
        id: 'm-1',
        petId: 'pet-1',
        name: '심장사상충약',
        endDate: new Date('2026-08-03T00:00:00Z'),
      },
    ]);
    appointmentService.findScheduledAfter.mockResolvedValue([
      {
        id: 'a-1',
        petId: 'pet-1',
        hospitalName: '행복동물병원',
        reason: '정기검진',
        scheduledAt: new Date('2026-08-05T00:00:00Z'),
      },
    ]);

    const schedules = await service.getUpcomingSchedules('user-1', 2);

    expect(schedules.map((s) => s.id)).toEqual(['m-1', 'a-1']);
  });

  // nextDueAt / endDate가 없는 행은 "다가오는 일정"이 될 수 없다. 필터가 빠지면
  // dueDate가 null인 항목이 정렬 단계에서 터진다.
  it('예정일이 없는 접종·투약은 일정에서 제외한다', async () => {
    vaccinationService.findDueAfter.mockResolvedValue([
      { id: 'v-1', petId: 'pet-1', name: '광견병', nextDueAt: null },
    ]);
    medicationService.findEndingAfter.mockResolvedValue([
      { id: 'm-1', petId: 'pet-1', name: '심장사상충약', endDate: null },
    ]);

    expect(await service.getUpcomingSchedules('user-1', 3)).toEqual([]);
  });
});

/**
 * 이 프로젝트의 삭제는 전부 소프트 삭제다(deletedAt에 시각을 찍는다).
 * 그래서 조회하는 쪽마다 `deletedAt: null`을 빠뜨리지 않아야 하는데, 이건 타입으로
 * 강제되지 않고 빠뜨려도 아무 데서도 실패하지 않는다 — 화면에 "지웠는데 그대로 있는"
 * 상태로만 드러난다.
 *
 * 실제로 calendarEvents / upcomingSchedules의 조회 9개가 전부 이 필터를 빠뜨리고
 * 있었다(코드 리뷰에서 발견). 삭제한 반려동물과 기록이 캘린더와 홈 알림에 계속 보였다.
 *
 * 조회가 UserResolver에서 각 도메인 서비스로 옮겨간 뒤에도 같은 것을 지킨다. 캘린더가
 * 쓰는 조회를 한 자리에 모아 보는 편이 "9개 중 하나만 빠진" 상황을 잡기 쉬우므로
 * 도메인별 spec으로 흩지 않고 여기에 둔다.
 */
describe('캘린더가 쓰는 도메인 조회 — 소프트 삭제 필터', () => {
  const petIds = ['pet-1', 'pet-2'];
  const start = new Date('2026-07-01');
  const end = new Date('2026-07-31');

  function makeServices() {
    const model = () => ({ findMany: jest.fn().mockResolvedValue([]) });
    const prisma = {
      healthRecord: model(),
      vaccination: model(),
      medication: model(),
      appointment: model(),
      medicalEvent: model(),
    };
    const p = prisma as unknown as PrismaService;
    const pet = {} as PetService;
    return {
      prisma,
      healthRecord: new HealthRecordService(p, pet),
      vaccination: new VaccinationService(p, pet),
      medication: new MedicationService(p, pet),
      appointment: new AppointmentService(p, pet),
      medicalEvent: new MedicalEventService(p, pet),
    };
  }

  it('기간 조회 5종이 모두 소프트 삭제된 행을 제외한다', async () => {
    const s = makeServices();

    await Promise.all([
      s.healthRecord.findByPetsInRange(petIds, start, end),
      s.vaccination.findByPetsInRange(petIds, start, end),
      s.medication.findByPetsInRange(petIds, start, end),
      s.appointment.findByPetsInRange(petIds, start, end),
      s.medicalEvent.findByPetsInRange(petIds, start, end),
    ]);

    const wheres = Object.values(s.prisma).flatMap((m) =>
      m.findMany.mock.calls.map(([args]) => (args as { where: Record<string, unknown> }).where),
    );
    expect(wheres).toHaveLength(5);
    for (const where of wheres) {
      expect(where).toMatchObject({ deletedAt: null, petId: { in: petIds } });
    }
  });

  it('다가오는 일정 조회 3종이 모두 소프트 삭제된 행을 제외한다', async () => {
    const s = makeServices();
    const now = new Date();

    await Promise.all([
      s.vaccination.findDueAfter(petIds, now),
      s.medication.findEndingAfter(petIds, now),
      s.appointment.findScheduledAfter(petIds, now),
    ]);

    const wheres = Object.values(s.prisma).flatMap((m) =>
      m.findMany.mock.calls.map(([args]) => (args as { where: Record<string, unknown> }).where),
    );
    expect(wheres).toHaveLength(3);
    for (const where of wheres) {
      expect(where).toMatchObject({ deletedAt: null, petId: { in: petIds } });
    }
  });

  // 분리 전 리졸버는 status를 'scheduled' 문자열 리터럴로 넣어, AppointmentService가 쓰는
  // enum과 갈라져 있었다. 조회가 한 곳으로 모인 뒤에도 같은 값을 쓰는지 고정한다.
  it('다가오는 예약 조회가 취소·완료된 예약을 제외한다', async () => {
    const s = makeServices();

    await s.appointment.findScheduledAfter(petIds, new Date());

    const [args] = s.prisma.appointment.findMany.mock.calls[0];
    expect((args as { where: { status: string } }).where.status).toBe('scheduled');
  });
});
