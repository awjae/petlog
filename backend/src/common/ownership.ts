import { NotFoundException } from '@nestjs/common';

/**
 * pet에 매달린 기록(건강기록·접종·투약·예약·진료·리포트)의 소유권 검증.
 *
 * 이 조건이 도메인마다 복붙돼 있으면, 새 도메인을 추가할 때 한 줄을 빠뜨리는 것만으로
 * 남의 기록을 수정할 수 있게 된다. 보안 경계는 흩어져 있을수록 위험하므로 한 곳에 모은다.
 *
 * 권한이 없는 경우에도 403이 아니라 404를 던진다. 403은 "그 id는 존재한다"는 사실을
 * 알려주므로, id를 바꿔가며 찔러보면 남의 기록이 몇 개나 있는지 셀 수 있다.
 * 존재하지 않는 것과 권한이 없는 것을 구분하지 않는 편이 안전하다.
 *
 * 소프트 삭제(deletedAt) 필터는 Prisma 확장(soft-delete.extension.ts)이 findFirst에
 * 자동으로 붙이므로 여기서 따로 걸지 않는다.
 */
export async function findOwnedOrThrow<T>(
  delegate: {
    findFirst(args: { where: { id: string; pet: { userId: string } } }): PromiseLike<T | null>;
  },
  userId: string,
  id: string,
  notFoundMessage: string,
): Promise<T> {
  const row = await delegate.findFirst({ where: { id, pet: { userId } } });
  if (!row) throw new NotFoundException(notFoundMessage);
  return row;
}
