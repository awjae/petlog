import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HealthRecordType } from '@prisma/client';
import { HealthRecordService } from './health-record.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { PetService } from '../pet/pet.service';
import type { CreateHealthRecordInput, UpdateHealthRecordInput } from './health-record.types';

const USER_ID = 'user-1';
const PET_ID = 'pet-1';
const RECORD_ID = 'record-1';

describe('HealthRecordService', () => {
  let service: HealthRecordService;
  let prisma: {
    healthRecord: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let petService: { assertOwnership: jest.Mock };

  beforeEach(() => {
    prisma = {
      healthRecord: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    petService = { assertOwnership: jest.fn().mockResolvedValue({ id: PET_ID, userId: USER_ID }) };

    service = new HealthRecordService(
      prisma as unknown as PrismaService,
      petService as unknown as PetService,
    );
  });

  describe('findAll', () => {
    it('소유권을 확인하고, 삭제되지 않은 기록을 최신순으로 조회해 numValue를 숫자로 변환한다', async () => {
      prisma.healthRecord.findMany.mockResolvedValue([
        { id: 'r1', type: HealthRecordType.weight, numValue: 5.2, textValue: null },
        { id: 'r2', type: HealthRecordType.mood, numValue: null, textValue: '좋음' },
      ]);

      const result = await service.findAll(USER_ID, PET_ID);

      expect(petService.assertOwnership).toHaveBeenCalledWith(USER_ID, PET_ID);
      expect(prisma.healthRecord.findMany).toHaveBeenCalledWith({
        where: { petId: PET_ID, deletedAt: null },
        orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result[0].numValue).toBe(5.2);
      expect(result[1].numValue).toBeNull();
    });
  });

  describe('create — 타입별 필드 검증', () => {
    const baseInput = { petId: PET_ID, recordedAt: new Date(2024, 0, 1) };

    const invalidCases: Array<[string, Partial<CreateHealthRecordInput>, string]> = [
      ['weight — numValue 누락', { type: HealthRecordType.weight }, 'numValue'],
      ['appetite — textValue 누락', { type: HealthRecordType.appetite }, 'textValue'],
      ['mood — textValue 누락', { type: HealthRecordType.mood }, 'textValue'],
      ['activity — numValue 누락', { type: HealthRecordType.activity }, 'numValue'],
      ['symptom — textValue 누락', { type: HealthRecordType.symptom, numValue: 3 }, 'textValue'],
      [
        'symptom — numValue 누락',
        { type: HealthRecordType.symptom, textValue: '구토' },
        'numValue',
      ],
      ['stool — textValue 누락', { type: HealthRecordType.stool }, 'textValue'],
      ['vomit — numValue 누락', { type: HealthRecordType.vomit }, 'numValue'],
    ];

    it.each(invalidCases)('%s → BadRequestException', async (_label, partialInput) => {
      const input = { ...baseInput, ...partialInput } as CreateHealthRecordInput;

      await expect(service.create(USER_ID, input)).rejects.toThrow(BadRequestException);
      expect(prisma.healthRecord.create).not.toHaveBeenCalled();
    });

    const validCases: Array<[string, Partial<CreateHealthRecordInput>]> = [
      ['weight', { type: HealthRecordType.weight, numValue: 5.2 }],
      ['appetite', { type: HealthRecordType.appetite, textValue: '보통' }],
      ['mood', { type: HealthRecordType.mood, textValue: '좋음' }],
      ['activity', { type: HealthRecordType.activity, numValue: 30 }],
      ['symptom', { type: HealthRecordType.symptom, textValue: '구토', numValue: 3 }],
      ['stool', { type: HealthRecordType.stool, textValue: '정상' }],
      ['vomit', { type: HealthRecordType.vomit, numValue: 1 }],
    ];

    it.each(validCases)('%s — 필수 필드가 있으면 생성한다', async (_label, partialInput) => {
      const input = { ...baseInput, ...partialInput } as CreateHealthRecordInput;
      prisma.healthRecord.create.mockResolvedValue({ id: RECORD_ID, ...input });

      const result = await service.create(USER_ID, input);

      expect(petService.assertOwnership).toHaveBeenCalledWith(USER_ID, PET_ID);
      expect(prisma.healthRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ petId: PET_ID, type: input.type }),
      });
      expect(result.id).toBe(RECORD_ID);
    });
  });

  describe('update', () => {
    it('기존 기록의 type 기준으로 검증하고, 존재하면 갱신한다', async () => {
      prisma.healthRecord.findFirst.mockResolvedValue({
        id: RECORD_ID,
        type: HealthRecordType.weight,
      });
      prisma.healthRecord.update.mockResolvedValue({
        id: RECORD_ID,
        type: HealthRecordType.weight,
        numValue: 6.1,
      });

      const input: UpdateHealthRecordInput = { numValue: 6.1 };
      const result = await service.update(USER_ID, RECORD_ID, input);

      expect(prisma.healthRecord.findFirst).toHaveBeenCalledWith({
        where: { id: RECORD_ID, pet: { userId: USER_ID } },
      });
      expect(result.numValue).toBe(6.1);
    });

    it('갱신 시에도 type에 맞는 필수 필드가 없으면 거부한다', async () => {
      prisma.healthRecord.findFirst.mockResolvedValue({
        id: RECORD_ID,
        type: HealthRecordType.weight,
      });

      await expect(
        service.update(USER_ID, RECORD_ID, { textValue: '엉뚱한 필드' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.healthRecord.update).not.toHaveBeenCalled();
    });

    it('존재하지 않는 기록이면 NotFoundException을 던진다', async () => {
      prisma.healthRecord.findFirst.mockResolvedValue(null);

      await expect(service.update(USER_ID, RECORD_ID, { numValue: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('존재하면 소프트 삭제(deletedAt 설정) 후 true를 반환한다', async () => {
      prisma.healthRecord.findFirst.mockResolvedValue({ id: RECORD_ID });
      prisma.healthRecord.update.mockResolvedValue({ id: RECORD_ID, deletedAt: new Date() });

      const result = await service.remove(USER_ID, RECORD_ID);

      expect(prisma.healthRecord.update).toHaveBeenCalledWith({
        where: { id: RECORD_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toBe(true);
    });

    it('존재하지 않는 기록이면 NotFoundException을 던진다', async () => {
      prisma.healthRecord.findFirst.mockResolvedValue(null);

      await expect(service.remove(USER_ID, RECORD_ID)).rejects.toThrow(NotFoundException);
      expect(prisma.healthRecord.update).not.toHaveBeenCalled();
    });
  });
});
