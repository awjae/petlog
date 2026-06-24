import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { CreateMedicationInput, UpdateMedicationInput } from './medication.types';

@Injectable()
export class MedicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    return this.prisma.medication.findMany({
      where: { petId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    const now = new Date();
    return this.prisma.medication.findMany({
      where: {
        petId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(userId: string, input: CreateMedicationInput) {
    await this.petService.assertOwnership(userId, input.petId);
    return this.prisma.medication.create({
      data: {
        petId: input.petId,
        name: input.name,
        dosage: input.dosage,
        frequency: input.frequency,
        startDate: input.startDate,
        endDate: input.endDate ?? undefined,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateMedicationInput) {
    await this.assertOwnership(userId, id);
    return this.prisma.medication.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        dosage: input.dosage ?? undefined,
        frequency: input.frequency ?? undefined,
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.medication.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  private async assertOwnership(userId: string, id: string) {
    const med = await this.prisma.medication.findFirst({
      where: { id, pet: { userId } },
    });
    if (!med) throw new NotFoundException('투약 정보를 찾을 수 없습니다.');
    return med;
  }
}
