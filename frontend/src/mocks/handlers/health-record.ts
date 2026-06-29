import { graphql, HttpResponse } from 'msw';
import { addMockRecord, getAllMockRecords } from '../data/record-store';

type CreateHealthRecordInput = {
  petId: string;
  type: string;
  recordedAt: string;
  numValue?: number;
  textValue?: string;
};

const SEED_RECORDS: Array<{
  id: string;
  petId: string;
  type: string;
  recordedAt: string;
  numValue: number | null;
  textValue: string | null;
  note: null;
}> = [
  {
    id: 'hr-1',
    petId: 'pet-1',
    type: 'weight',
    recordedAt: '2026-06-20T09:00:00.000Z',
    numValue: 3.2,
    textValue: null,
    note: null,
  },
  {
    id: 'hr-2',
    petId: 'pet-1',
    type: 'appetite',
    recordedAt: '2026-06-19T08:00:00.000Z',
    numValue: null,
    textValue: '잘 먹음',
    note: null,
  },
  {
    id: 'hr-3',
    petId: 'pet-1',
    type: 'activity',
    recordedAt: '2026-06-18T07:00:00.000Z',
    numValue: 30,
    textValue: '1.2',
    note: null,
  },
  {
    id: 'hr-4',
    petId: 'pet-1',
    type: 'mood',
    recordedAt: '2026-06-17T08:00:00.000Z',
    numValue: null,
    textValue: '오늘 유독 활발하게 놀았어요',
    note: null,
  },
  {
    id: 'hr-5',
    petId: 'pet-1',
    type: 'weight',
    recordedAt: '2026-06-15T09:00:00.000Z',
    numValue: 3.1,
    textValue: null,
    note: null,
  },
  {
    id: 'hr-6',
    petId: 'pet-1',
    type: 'stool',
    recordedAt: '2026-06-14T10:00:00.000Z',
    numValue: null,
    textValue: '정상',
    note: null,
  },
  {
    id: 'hr-7',
    petId: 'pet-1',
    type: 'weight',
    recordedAt: '2026-06-10T09:00:00.000Z',
    numValue: 3.0,
    textValue: null,
    note: null,
  },
  {
    id: 'hr-8',
    petId: 'pet-2',
    type: 'weight',
    recordedAt: '2026-06-18T10:00:00.000Z',
    numValue: 4.8,
    textValue: null,
    note: null,
  },
];

export const healthRecordHandlers = [
  graphql.query('HealthRecords', ({ variables }) => {
    const { petId } = variables as { petId: string };
    const newRecords = getAllMockRecords(petId);
    const seedRecords = SEED_RECORDS.filter((r) => r.petId === petId);

    const newIds = new Set(newRecords.map((r) => r.id));
    const merged = [...newRecords, ...seedRecords.filter((r) => !newIds.has(r.id))];

    return HttpResponse.json({ data: { healthRecords: merged } });
  }),

  graphql.mutation('CreateHealthRecord', ({ variables }) => {
    const { input } = variables as { input: CreateHealthRecordInput };
    const id = `hr-${Date.now()}`;

    addMockRecord({
      id,
      petId: input.petId,
      type: input.type,
      recordedAt: input.recordedAt,
      numValue: input.numValue,
      textValue: input.textValue,
    });

    return HttpResponse.json({
      data: {
        createHealthRecord: {
          id,
          type: input.type,
          recordedAt: input.recordedAt,
        },
      },
    });
  }),
];
