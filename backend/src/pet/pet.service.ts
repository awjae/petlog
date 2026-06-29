import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Pet as PrismaPet } from '@prisma/client';
import { HealthRecordType } from '@prisma/client';
import { CreatePetInput, UpdatePetInput, RecentWeight, HealthRecordSummary } from './pet.types';

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
        isNeutered: input.isNeutered ?? false,
        profileImageUrl: input.profileImageUrl ?? undefined,
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
        isNeutered: input.isNeutered ?? undefined,
        profileImageUrl: input.profileImageUrl ?? undefined,
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

  async findRecentWeight(petId: string): Promise<RecentWeight | null> {
    const record = await this.prisma.healthRecord.findFirst({
      where: { petId, type: HealthRecordType.weight, deletedAt: null },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });
    if (!record || record.numValue == null) return null;
    return { value: Number(record.numValue), recordedAt: record.recordedAt };
  }

  async countTodayRecords(petId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.healthRecord.count({
      where: { petId, deletedAt: null, recordedAt: { gte: today, lt: tomorrow } },
    });
  }

  async findRecentHealthRecords(petId: string, limit: number): Promise<HealthRecordSummary[]> {
    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return records.map((r) => ({
      id: r.id,
      type: r.type,
      recordedAt: r.recordedAt,
      summary: this.buildSummary(
        r.type,
        r.numValue != null ? Number(r.numValue) : null,
        r.textValue,
      ),
    }));
  }

  private buildSummary(type: string, numValue: number | null, textValue: string | null): string {
    const COUNT_LABEL: Record<number, string> = { 1: '1회', 2: '2-3회', 3: '4회 이상' };
    const SEVERITY_LABEL: Record<number, string> = { 1: '경미함', 2: '보통', 3: '심각함' };

    switch (type) {
      case 'weight':
        return numValue != null ? `${numValue} kg` : '';
      case 'appetite':
        return textValue ?? '';
      case 'activity': {
        const duration = numValue != null ? `${numValue}분` : '';
        const distance = textValue ? ` · ${textValue}km` : '';
        return duration + distance;
      }
      case 'mood':
        return textValue ?? '';
      case 'symptom': {
        const severity = numValue != null ? SEVERITY_LABEL[numValue] : null;
        if (textValue && severity) return `${textValue} · ${severity}`;
        return textValue ?? '';
      }
      case 'stool': {
        const count = numValue != null ? COUNT_LABEL[numValue] : null;
        if (textValue && count) return `${textValue} · ${count}`;
        return textValue ?? '';
      }
      case 'vomit': {
        const count = numValue != null ? COUNT_LABEL[numValue] : null;
        if (textValue && count) return `${textValue} · ${count}`;
        if (count) return count;
        return textValue ?? '';
      }
      default:
        return textValue ?? '';
    }
  }

  private serialize(pet: PrismaPet) {
    return {
      ...pet,
      weight: pet.weight != null ? Number(pet.weight) : null,
    };
  }
}
