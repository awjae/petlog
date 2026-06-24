import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { CreateMedicalEventInput, UpdateMedicalEventInput } from './medical-event.types';

@Injectable()
export class MedicalEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    return this.prisma.medicalEvent.findMany({
      where: { petId },
      orderBy: { visitDate: 'desc' },
    });
  }

  async create(userId: string, input: CreateMedicalEventInput) {
    await this.petService.assertOwnership(userId, input.petId);
    return this.prisma.medicalEvent.create({
      data: {
        petId: input.petId,
        hospitalName: input.hospitalName,
        visitDate: input.visitDate,
        description: input.description,
        attachmentUrls: input.attachmentUrls ?? [],
      },
    });
  }

  async update(userId: string, id: string, input: UpdateMedicalEventInput) {
    await this.assertOwnership(userId, id);
    return this.prisma.medicalEvent.update({
      where: { id },
      data: {
        hospitalName: input.hospitalName ?? undefined,
        visitDate: input.visitDate ?? undefined,
        description: input.description ?? undefined,
        attachmentUrls: input.attachmentUrls ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.medicalEvent.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  private async assertOwnership(userId: string, id: string) {
    const event = await this.prisma.medicalEvent.findFirst({
      where: { id, pet: { userId } },
    });
    if (!event) throw new NotFoundException('진료 기록을 찾을 수 없습니다.');
    return event;
  }
}
