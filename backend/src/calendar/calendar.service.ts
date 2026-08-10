import { Injectable } from '@nestjs/common';
import { PetService } from '../pet/pet.service';
import { HealthRecordService } from '../health-record/health-record.service';
import { VaccinationService } from '../vaccination/vaccination.service';
import { MedicationService } from '../medication/medication.service';
import { AppointmentService } from '../appointment/appointment.service';
import { MedicalEventService } from '../medical-event/medical-event.service';
import { CalendarEvent, CalendarEventType, ScheduleType, UpcomingSchedule } from './calendar.types';

// 캘린더에 찍히는 건강 기록의 표시 라벨. 값 자체(체중 4.2kg 등)의 표기는 프론트가
// recordType/numValue/textValue로 조립하므로 여기서는 종류 이름만 정한다.
const HEALTH_RECORD_LABEL: Record<string, string> = {
  weight: '체중',
  appetite: '식사',
  activity: '활동',
  symptom: '증상',
  stool: '대변',
  vomit: '구토',
  mood: '기분',
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

/**
 * 여러 도메인의 기록을 날짜 축 하나로 모으는 조회 전용 서비스.
 *
 * 캘린더 화면(calendarEvents)과 홈 화면(upcomingSchedules)이 쓴다. 둘 다 "사용자의 모든
 * 반려동물에 걸친 이벤트를 날짜순으로 본다"는 같은 일을 하므로 한 서비스에 둔다.
 *
 * 각 도메인 데이터는 해당 도메인 서비스를 통해서만 가져온다. 이 서비스가 Prisma를 직접
 * 들여다보면 조회 규칙(소프트 삭제, 예약 상태 필터 등)이 도메인 서비스와 캘린더 두 곳으로
 * 갈라져 한쪽만 고치는 사고가 난다. 실제로 분리 전에는 예약 상태 조건이 리졸버에서는
 * 문자열 리터럴, AppointmentService에서는 enum으로 갈라져 있었다.
 */
@Injectable()
export class CalendarService {
  constructor(
    private readonly petService: PetService,
    private readonly healthRecordService: HealthRecordService,
    private readonly vaccinationService: VaccinationService,
    private readonly medicationService: MedicationService,
    private readonly appointmentService: AppointmentService,
    private readonly medicalEventService: MedicalEventService,
  ) {}

  async getCalendarEvents(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 도메인 조회에 넘길 pet 목록을 여기서 한 번 확정한다. PetService.findAll이 소유자와
    // 소프트 삭제를 이미 거르므로, 이후 조회들은 소유권을 다시 확인하지 않아도 된다.
    const pets = await this.petService.findAll(userId);
    const petIds = pets.map((p) => p.id);

    const [healthRecords, vaccinations, medications, appointments, medicalEvents] =
      await Promise.all([
        this.healthRecordService.findByPetsInRange(petIds, start, end),
        this.vaccinationService.findByPetsInRange(petIds, start, end),
        this.medicationService.findByPetsInRange(petIds, start, end),
        this.appointmentService.findByPetsInRange(petIds, start, end),
        this.medicalEventService.findByPetsInRange(petIds, start, end),
      ]);

    const events: CalendarEvent[] = [
      ...healthRecords.map((r) => ({
        id: r.id,
        date: toDateStr(r.recordedAt),
        type: CalendarEventType.health_record,
        title: HEALTH_RECORD_LABEL[r.type] ?? r.type,
        // 표기(단위·등급 라벨)는 프론트의 buildSummary 한 곳에서만 조립한다.
        recordType: r.type,
        numValue: r.numValue ?? undefined,
        textValue: r.textValue ?? undefined,
        petId: r.petId,
      })),
      ...vaccinations.map((v) => ({
        id: v.id,
        date: toDateStr(v.vaccinatedAt),
        type: CalendarEventType.vaccination,
        title: v.name ?? '',
        subtitle: v.code ?? undefined,
        petId: v.petId,
      })),
      ...medications.map((m) => ({
        id: m.id,
        date: toDateStr(m.startDate),
        type: CalendarEventType.medication,
        title: m.name ?? '',
        subtitle: m.dosage ?? undefined,
        petId: m.petId,
      })),
      ...appointments.map((a) => ({
        id: a.id,
        date: toDateStr(a.scheduledAt),
        type: CalendarEventType.appointment,
        title: a.hospitalName,
        subtitle: a.reason ?? undefined,
        petId: a.petId,
      })),
      ...medicalEvents.map((e) => ({
        id: e.id,
        date: toDateStr(e.visitDate),
        type: CalendarEventType.medical_event,
        title: e.hospitalName,
        subtitle: e.description ?? undefined,
        petId: e.petId,
      })),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getUpcomingSchedules(userId: string, limit: number) {
    const now = new Date();

    const pets = await this.petService.findAll(userId);
    const petIds = pets.map((p) => p.id);
    const petMap = new Map(pets.map((p) => [p.id, p]));

    const [vaccinations, medications, appointments] = await Promise.all([
      this.vaccinationService.findDueAfter(petIds, now),
      this.medicationService.findEndingAfter(petIds, now),
      this.appointmentService.findScheduledAfter(petIds, now),
    ]);

    const petName = (petId: string) => petMap.get(petId)?.name ?? '';
    const petImage = (petId: string) => petMap.get(petId)?.profileImageUrl ?? undefined;

    const schedules: UpcomingSchedule[] = [
      ...vaccinations
        .filter((v) => v.nextDueAt != null)
        .map((v) => ({
          id: v.id,
          petId: v.petId,
          petName: petName(v.petId),
          petProfileImageUrl: petImage(v.petId),
          type: ScheduleType.vaccination,
          title: v.name ?? '',
          dueDate: v.nextDueAt!,
        })),
      ...medications
        .filter((m) => m.endDate != null)
        .map((m) => ({
          id: m.id,
          petId: m.petId,
          petName: petName(m.petId),
          petProfileImageUrl: petImage(m.petId),
          type: ScheduleType.medication,
          title: m.name ?? '',
          dueDate: m.endDate!,
        })),
      ...appointments.map((a) => ({
        id: a.id,
        petId: a.petId,
        petName: petName(a.petId),
        petProfileImageUrl: petImage(a.petId),
        type: ScheduleType.appointment,
        title: a.reason ?? a.hospitalName ?? '',
        dueDate: a.scheduledAt,
      })),
    ];

    return schedules.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, limit);
  }
}
