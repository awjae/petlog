import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import type { HealthRecord as PrismaHealthRecord } from '@prisma/client';
import { HealthRecordType } from '@prisma/client';
import {
  CreateHealthRecordInput,
  UpdateHealthRecordInput,
  HEALTH_RECORD_VALUE_KIND,
} from './health-record.types';

@Injectable()
export class HealthRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    const records = await this.prisma.healthRecord.findMany({
      where: { petId },
      orderBy: { recordedAt: 'desc' },
    });
    return records.map(this.serialize);
  }

  async create(userId: string, input: CreateHealthRecordInput) {
    await this.petService.assertOwnership(userId, input.petId);
    this.validateValue(input.type, input);

    const record = await this.prisma.healthRecord.create({
      data: {
        petId: input.petId,
        type: input.type,
        numValue: input.numValue ?? undefined,
        textValue: input.textValue ?? undefined,
        note: input.note ?? undefined,
        recordedAt: input.recordedAt,
      },
    });
    return this.serialize(record);
  }

  async update(userId: string, id: string, input: UpdateHealthRecordInput) {
    const record = await this.assertOwnership(userId, id);
    this.validateValue(record.type, input);

    const updated = await this.prisma.healthRecord.update({
      where: { id },
      data: {
        numValue: input.numValue ?? undefined,
        textValue: input.textValue ?? undefined,
        note: input.note ?? undefined,
        recordedAt: input.recordedAt ?? undefined,
      },
    });
    return this.serialize(updated);
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.healthRecord.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  private async assertOwnership(userId: string, id: string) {
    const record = await this.prisma.healthRecord.findFirst({
      where: { id, pet: { userId } },
    });
    if (!record) throw new NotFoundException('기록을 찾을 수 없습니다.');
    return record;
  }

  private validateValue(
    type: HealthRecordType,
    input: { numValue?: number | null; textValue?: string | null },
  ) {
    if (HEALTH_RECORD_VALUE_KIND[type] === 'numeric') {
      if (input.numValue == null)
        throw new BadRequestException(`${type} 기록에는 numValue가 필요합니다.`);
    } else {
      if (!input.textValue)
        throw new BadRequestException(`${type} 기록에는 textValue가 필요합니다.`);
    }
  }

  private serialize(record: PrismaHealthRecord) {
    return {
      ...record,
      numValue: record.numValue != null ? Number(record.numValue) : null,
    };
  }
}
