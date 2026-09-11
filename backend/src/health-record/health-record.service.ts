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

  // type·limit을 주지 않으면 전체를 돌려준다(타임라인). GraphQL은 선택 인자를 null로 넘길 수
  // 있는데 Prisma는 enum 필드의 null 조건과 take: null을 거부하므로 undefined로 바꾼다.
  async findAll(
    userId: string,
    petId: string,
    filter: { type?: HealthRecordType | null; limit?: number | null } = {},
  ) {
    // Prisma는 음수 take를 "뒤에서부터"로 해석해 가장 오래된 기록을 돌려준다. 최신 N건을
    // 기대한 호출자가 조용히 틀린 데이터를 받지 않도록 거부한다.
    if (filter.limit != null && filter.limit < 1) {
      throw new BadRequestException('limit은 1 이상이어야 합니다.');
    }

    await this.petService.assertOwnership(userId, petId);
    const records = await this.prisma.healthRecord.findMany({
      where: { petId, deletedAt: null, type: filter.type ?? undefined },
      orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
      take: filter.limit ?? undefined,
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
