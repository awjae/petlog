import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { CreateVaccinationInput, UpdateVaccinationInput } from './vaccination.types';

@Injectable()
export class VaccinationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    return this.prisma.vaccination.findMany({
      where: { petId },
      orderBy: { vaccinatedAt: 'desc' },
    });
  }

  async findUpcoming(userId: string) {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    return this.prisma.vaccination.findMany({
      where: {
        pet: { userId },
        nextDueAt: { gte: new Date(), lte: in30Days },
      },
      orderBy: { nextDueAt: 'asc' },
    });
  }

  async create(userId: string, input: CreateVaccinationInput) {
    await this.petService.assertOwnership(userId, input.petId);
    return this.prisma.vaccination.create({
      data: {
        petId: input.petId,
        name: input.name,
        code: input.code ?? undefined,
        vaccinatedAt: input.vaccinatedAt,
        nextDueAt: input.nextDueAt ?? undefined,
        memo: input.memo ?? undefined,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateVaccinationInput) {
    await this.assertOwnership(userId, id);
    return this.prisma.vaccination.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        code: input.code ?? undefined,
        vaccinatedAt: input.vaccinatedAt ?? undefined,
        nextDueAt: input.nextDueAt ?? undefined,
        memo: input.memo ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.vaccination.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  private async assertOwnership(userId: string, id: string) {
    const vacc = await this.prisma.vaccination.findFirst({
      where: { id, pet: { userId } },
    });
    if (!vacc) throw new NotFoundException('예방접종 기록을 찾을 수 없습니다.');
    return vacc;
  }
}
