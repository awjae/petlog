import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { findOwnedOrThrow } from '../common/ownership';
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

  // petIds 기반 조회 — 호출자(캘린더/홈)가 이미 소유권을 확인한 pet 목록을 넘긴다.
  async findByPetsInRange(petIds: string[], start: Date, end: Date) {
    return this.prisma.medication.findMany({
      where: { petId: { in: petIds }, deletedAt: null, startDate: { gte: start, lte: end } },
    });
  }

  async findEndingAfter(petIds: string[], from: Date) {
    return this.prisma.medication.findMany({
      where: { petId: { in: petIds }, deletedAt: null, endDate: { gte: from } },
      orderBy: { endDate: 'asc' },
    });
  }

  async create(userId: string, input: CreateMedicationInput) {
    await this.petService.assertOwnership(userId, input.petId);
    return this.prisma.medication.create({
      data: {
        petId: input.petId,
        name: input.name ?? null,
        dosage: input.dosage ?? null,
        frequency: input.frequency ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
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

  private assertOwnership(userId: string, id: string) {
    return findOwnedOrThrow(this.prisma.medication, userId, id, '투약 정보를 찾을 수 없습니다.');
  }
}
