import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointment.types';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    return this.prisma.appointment.findMany({
      where: { petId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findUpcoming(userId: string) {
    return this.prisma.appointment.findMany({
      where: {
        pet: { userId },
        status: AppointmentStatus.scheduled,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(userId: string, input: CreateAppointmentInput) {
    await this.petService.assertOwnership(userId, input.petId);
    return this.prisma.appointment.create({
      data: {
        petId: input.petId,
        hospitalName: input.hospitalName,
        scheduledAt: input.scheduledAt,
        reason: input.reason ?? undefined,
        memo: input.memo ?? undefined,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateAppointmentInput) {
    await this.assertOwnership(userId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        hospitalName: input.hospitalName ?? undefined,
        scheduledAt: input.scheduledAt ?? undefined,
        reason: input.reason ?? undefined,
        status: input.status ?? undefined,
        memo: input.memo ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  private async assertOwnership(userId: string, id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, pet: { userId } },
    });
    if (!appt) throw new NotFoundException('예약을 찾을 수 없습니다.');
    return appt;
  }
}
