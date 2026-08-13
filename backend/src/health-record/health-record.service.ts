import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import { findOwnedOrThrow } from '../common/ownership';
import type { HealthRecord as PrismaHealthRecord } from '@prisma/client';
import { HealthRecordType } from '@prisma/client';
import { CreateHealthRecordInput, UpdateHealthRecordInput } from './health-record.types';

@Injectable()
export class HealthRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService,
  ) {}

  async findAll(userId: string, petId: string) {
    await this.petService.assertOwnership(userId, petId);
    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map(this.serialize);
  }

  // petIds 기반 조회 — 호출자(캘린더)가 이미 소유권을 확인한 pet 목록을 넘긴다.
  // 다른 조회와 동일하게 Decimal → number 직렬화를 거쳐 나간다.
  async findByPetsInRange(petIds: string[], start: Date, end: Date) {
    const records = await this.prisma.healthRecord.findMany({
      where: { petId: { in: petIds }, deletedAt: null, recordedAt: { gte: start, lte: end } },
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

  private assertOwnership(userId: string, id: string) {
    return findOwnedOrThrow(this.prisma.healthRecord, userId, id, '기록을 찾을 수 없습니다.');
  }

  private validateValue(
    type: HealthRecordType,
    input: { numValue?: number | null; textValue?: string | null },
  ) {
    switch (type) {
      case HealthRecordType.weight:
        if (input.numValue == null)
          throw new BadRequestException('체중 기록에는 numValue가 필요합니다.');
        break;
      case HealthRecordType.appetite:
      case HealthRecordType.mood:
        if (!input.textValue)
          throw new BadRequestException(`${type} 기록에는 textValue가 필요합니다.`);
        break;
      case HealthRecordType.activity:
        if (input.numValue == null)
          throw new BadRequestException('산책 기록에는 numValue(시간)가 필요합니다.');
        break;
      case HealthRecordType.symptom:
        if (!input.textValue)
          throw new BadRequestException('증상 기록에는 textValue(증상 목록)가 필요합니다.');
        if (input.numValue == null)
          throw new BadRequestException('증상 기록에는 numValue(심각도)가 필요합니다.');
        break;
      case HealthRecordType.stool:
        if (!input.textValue)
          throw new BadRequestException('배변 기록에는 textValue(형태)가 필요합니다.');
        break;
      case HealthRecordType.vomit:
        if (input.numValue == null)
          throw new BadRequestException('구토 기록에는 numValue(횟수)가 필요합니다.');
        break;
    }
  }

  private serialize(record: PrismaHealthRecord) {
    return {
      ...record,
      numValue: record.numValue != null ? Number(record.numValue) : null,
    };
  }
}
