import { Prisma } from '@prisma/client';

const makeFilter = <T extends { where?: Record<string, unknown> }>(args: T): T => ({
  ...args,
  where: { ...args.where, deletedAt: null },
});

const makeUniqueFilter = <T extends { where: Record<string, unknown> }>(args: T): T => ({
  ...args,
  where: { ...args.where, deletedAt: null } as T['where'],
});

// Soft Delete 적용 모델: Pet, HealthRecord, MedicalEvent, Medication, Vaccination, Appointment
// 삭제 실행은 서비스 레이어에서 update({ data: { deletedAt: new Date() } })로 처리
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    pet: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
    healthRecord: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
    medicalEvent: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
    medication: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
    vaccination: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
    appointment: {
      findUnique: ({ args, query }) => query(makeUniqueFilter(args)),
      findUniqueOrThrow: ({ args, query }) => query(makeUniqueFilter(args)),
      findFirst: ({ args, query }) => query(makeFilter(args)),
      findFirstOrThrow: ({ args, query }) => query(makeFilter(args)),
      findMany: ({ args, query }) => query(makeFilter(args)),
      count: ({ args, query }) => query(makeFilter(args)),
      aggregate: ({ args, query }) => query(makeFilter(args)),
    },
  },
});
