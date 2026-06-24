import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Pet as PrismaPet } from '@prisma/client';
import { CreatePetInput, UpdatePetInput } from './pet.types';

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const pets = await this.prisma.pet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return pets.map(this.serialize);
  }

  async findOne(userId: string, id: string) {
    const pet = await this.prisma.pet.findFirst({ where: { id, userId } });
    if (!pet) throw new NotFoundException('반려동물을 찾을 수 없습니다.');
    return this.serialize(pet);
  }

  async create(userId: string, input: CreatePetInput) {
    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name: input.name,
        species: input.species,
        breed: input.breed ?? undefined,
        birthDate: input.birthDate ?? undefined,
        gender: input.gender,
        weight: input.weight ?? undefined,
      },
    });
    return this.serialize(pet);
  }

  async update(userId: string, id: string, input: UpdatePetInput) {
    await this.findOne(userId, id);
    const pet = await this.prisma.pet.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        species: input.species ?? undefined,
        breed: input.breed ?? undefined,
        birthDate: input.birthDate ?? undefined,
        gender: input.gender ?? undefined,
        weight: input.weight ?? undefined,
      },
    });
    return this.serialize(pet);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.pet.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  async assertOwnership(userId: string, petId: string) {
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, userId } });
    if (!pet) throw new ForbiddenException('접근 권한이 없습니다.');
    return pet;
  }

  private serialize(pet: PrismaPet) {
    return {
      ...pet,
      weight: pet.weight != null ? Number(pet.weight) : null,
    };
  }
}
