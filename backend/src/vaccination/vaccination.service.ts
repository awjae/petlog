import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { findOwnedOrThrow } from '../common/ownership';
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

  // 아래 두 메서드는 캘린더/홈처럼 여러 도메인을 한 화면에 모으는 쪽에서 쓴다.
  // userId가 아니라 petIds를 받는 이유는 호출자가 이미 "그 사용자의 pet"만 추려서
  // 넘기기 때문이다. 소유권 검증은 pet 목록을 만드는 시점에 끝나 있다.
  async findByPetsInRange(petIds: string[], start: Date, end: Date) {
    return this.prisma.vaccination.findMany({
      where: { petId: { in: petIds }, deletedAt: null, vaccinatedAt: { gte: start, lte: end } },
    });
  }

  async findDueAfter(petIds: string[], from: Date) {
    return this.prisma.vaccination.findMany({
      where: { petId: { in: petIds }, deletedAt: null, nextDueAt: { gte: from } },
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

  private assertOwnership(userId: string, id: string) {
    return findOwnedOrThrow(
      this.prisma.vaccination,
      userId,
      id,
      '예방접종 기록을 찾을 수 없습니다.',
    );
  }
}
