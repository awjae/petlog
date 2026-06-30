import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { UserService } from './user.service';
import {
  User,
  UpdateProfileInput,
  UpcomingSchedule,
  ScheduleType,
  CalendarEvent,
  CalendarEventType,
} from './user.types';
import { Pet } from '../pet/pet.types';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@Resolver(() => User)
@UseGuards(GqlAuthGuard)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly petService: PetService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => User)
  async me(@CurrentUser() authUser: AuthUser) {
    const user = await this.userService.findById(authUser.id);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  @Mutation(() => User)
  async updateProfile(@CurrentUser() authUser: AuthUser, @Args('input') input: UpdateProfileInput) {
    if (!input.name) throw new BadRequestException('변경할 내용이 없습니다.');
    return this.userService.updateProfile(authUser.id, input.name);
  }

  @ResolveField(() => [Pet])
  pets(@Parent() user: User) {
    return this.petService.findAll(user.id);
  }

  @ResolveField(() => [String])
  recordDates(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 90 }) limit: number,
  ): Promise<string[]> {
    return this.userService.getRecordDates(user.id, limit);
  }

  @ResolveField(() => [CalendarEvent])
  async calendarEvents(
    @Parent() user: User,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<CalendarEvent[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const pets = await this.prisma.pet.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const petIds = pets.map((p) => p.id);

    const [healthRecords, vaccinations, medications, appointments, medicalEvents] =
      await Promise.all([
        this.prisma.healthRecord.findMany({
          where: { petId: { in: petIds }, recordedAt: { gte: start, lte: end } },
        }),
        this.prisma.vaccination.findMany({
          where: { petId: { in: petIds }, vaccinatedAt: { gte: start, lte: end } },
        }),
        this.prisma.medication.findMany({
          where: { petId: { in: petIds }, startDate: { gte: start, lte: end } },
        }),
        this.prisma.appointment.findMany({
          where: { petId: { in: petIds }, scheduledAt: { gte: start, lte: end } },
        }),
        this.prisma.medicalEvent.findMany({
          where: { petId: { in: petIds }, visitDate: { gte: start, lte: end } },
        }),
      ]);

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    const HEALTH_RECORD_LABEL: Record<string, string> = {
      weight: '체중',
      appetite: '식사',
      activity: '활동',
      symptom: '증상',
      stool: '대변',
      vomit: '구토',
      mood: '기분',
    };

    const events: CalendarEvent[] = [
      ...healthRecords.map((r) => ({
        id: r.id,
        date: toDateStr(r.recordedAt),
        type: CalendarEventType.health_record,
        title: HEALTH_RECORD_LABEL[r.type] ?? r.type,
        subtitle: r.textValue ?? (r.numValue != null ? String(r.numValue) : undefined),
        petId: r.petId,
      })),
      ...vaccinations.map((v) => ({
        id: v.id,
        date: toDateStr(v.vaccinatedAt),
        type: CalendarEventType.vaccination,
        title: v.name ?? '',
        subtitle: v.code ?? undefined, // Ensure subtitle is undefined instead of null
        petId: v.petId,
      })),
      ...medications.map((m) => ({
        id: m.id,
        date: toDateStr(m.startDate),
        type: CalendarEventType.medication,
        title: m.name ?? '',
        subtitle: m.dosage ?? undefined, // Ensure subtitle is undefined instead of null
        petId: m.petId,
      })),
      ...appointments.map((a) => ({
        id: a.id,
        date: toDateStr(a.scheduledAt),
        type: CalendarEventType.appointment,
        title: a.hospitalName,
        subtitle: a.reason ?? undefined, // Ensure subtitle is undefined instead of null
        petId: a.petId,
      })),
      ...medicalEvents.map((e) => ({
        id: e.id,
        date: toDateStr(e.visitDate),
        type: CalendarEventType.medical_event,
        title: e.hospitalName,
        subtitle: e.description ?? undefined, // Ensure subtitle is undefined instead of null
        petId: e.petId,
      })),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  @ResolveField(() => [UpcomingSchedule])
  async upcomingSchedules(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 3 }) limit: number,
  ): Promise<UpcomingSchedule[]> {
    const now = new Date();

    const pets = await this.prisma.pet.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    });
    const petIds = pets.map((p) => p.id);
    const petMap = new Map(pets.map((p) => [p.id, p.name]));

    const [vaccinations, medications, appointments] = await Promise.all([
      this.prisma.vaccination.findMany({
        where: { petId: { in: petIds }, nextDueAt: { gte: now } },
        orderBy: { nextDueAt: 'asc' },
      }),
      this.prisma.medication.findMany({
        where: { petId: { in: petIds }, endDate: { gte: now } },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: { petId: { in: petIds }, scheduledAt: { gte: now }, status: 'scheduled' },
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);

    const schedules: UpcomingSchedule[] = [
      ...vaccinations
        .filter((v) => v.nextDueAt != null)
        .map((v) => ({
          id: v.id,
          petId: v.petId,
          petName: petMap.get(v.petId) ?? '',
          petProfileImageUrl: undefined,
          type: ScheduleType.vaccination,
          title: v.name ?? '',
          dueDate: v.nextDueAt!,
        })),
      ...medications
        .filter((m) => m.endDate != null)
        .map((m) => ({
          id: m.id,
          petId: m.petId,
          petName: petMap.get(m.petId) ?? '',
          petProfileImageUrl: undefined,
          type: ScheduleType.medication,
          title: m.name ?? '',
          dueDate: m.endDate!,
        })),
      ...appointments.map((a) => ({
        id: a.id,
        petId: a.petId,
        petName: petMap.get(a.petId) ?? '',
        petProfileImageUrl: undefined,
        type: ScheduleType.appointment,
        title: a.reason ?? a.hospitalName ?? '',
        dueDate: a.scheduledAt,
      })),
    ];

    return schedules.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, limit);
  }
}
