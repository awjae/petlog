import { Prisma } from '@prisma/client';

// Pet, HealthRecord 조회 시 deletedAt: null 자동 필터
// 삭제는 서비스 레이어에서 update({ data: { deletedAt: new Date() } })로 직접 처리
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    pet: {
      async findUnique({ args, query }) {
        // findUnique.where 타입은 unique 필드만 허용하지만,
        // 런타임에서는 추가 조건을 SQL WHERE절에 포함시켜 처리 가능
        return query({
          ...args,
          where: { ...args.where, deletedAt: null } as typeof args.where,
        });
      },
      async findUniqueOrThrow({ args, query }) {
        return query({
          ...args,
          where: { ...args.where, deletedAt: null } as typeof args.where,
        });
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirstOrThrow({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async aggregate({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    healthRecord: {
      async findUnique({ args, query }) {
        return query({
          ...args,
          where: { ...args.where, deletedAt: null } as typeof args.where,
        });
      },
      async findUniqueOrThrow({ args, query }) {
        return query({
          ...args,
          where: { ...args.where, deletedAt: null } as typeof args.where,
        });
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirstOrThrow({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async aggregate({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
