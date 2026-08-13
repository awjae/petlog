import { HttpException, NotFoundException } from '@nestjs/common';
import { findOwnedOrThrow } from './ownership';
import { PrismaService } from './prisma/prisma.service';
import { PetService } from '../pet/pet.service';

const USER_ID = 'user-1';
const ID = 'row-1';

describe('findOwnedOrThrow', () => {
  it('id와 소유자를 함께 걸어 조회한다', async () => {
    const delegate = { findFirst: jest.fn().mockResolvedValue({ id: ID }) };

    const row = await findOwnedOrThrow(delegate, USER_ID, ID, '없습니다.');

    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { id: ID, pet: { userId: USER_ID } },
    });
    expect(row).toEqual({ id: ID });
  });

  it('행이 없으면 NotFoundException을 던진다', async () => {
    const delegate = { findFirst: jest.fn().mockResolvedValue(null) };

    await expect(
      findOwnedOrThrow(delegate, USER_ID, ID, '기록을 찾을 수 없습니다.'),
    ).rejects.toThrow(new NotFoundException('기록을 찾을 수 없습니다.'));
  });
});

/**
 * pet은 userId를 직접 들고 있어 findOwnedOrThrow를 쓰지 못하는 유일한 도메인이다.
 * 통일 전에는 여기만 403이라, id를 바꿔가며 찔러보면 pet만 존재 여부가 새어나갔다.
 * 나머지 도메인은 헬퍼가 보장하므로 규칙이 다시 갈라질 수 있는 이 경로만 따로 고정한다.
 */
it('pet — 남의 리소스에 403이 아니라 404로 답한다', async () => {
  const prisma = {
    pet: { findFirst: jest.fn().mockResolvedValue(null) },
  } as unknown as PrismaService;

  const thrown = await new PetService(prisma).assertOwnership(USER_ID, ID).catch((e: unknown) => e);

  expect(thrown).toBeInstanceOf(HttpException);
  expect((thrown as HttpException).getStatus()).toBe(404);
});
