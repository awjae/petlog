import { graphql, HttpResponse, type GraphQLResponseBody } from 'msw';
import type { PetDetailQuery, PetEditQuery } from '@/generated/graphql';
import { mockHomeData } from '../data/home';
import { getMockRecentRecords, getMockTodayCount } from '../data/record-store';

/**
 * 반려동물 상세/수정 목업.
 *
 * 이 핸들러가 없으면 목업 모드에서 홈은 pet-1을 보여주는데 상세로 들어가는 순간
 * 요청이 MSW를 그냥 통과해 실제 백엔드로 나가고, 그쪽에는 pet-1이 없으니 404가
 * 돌아와 "반려동물을 찾을 수 없어요"가 뜬다.
 *
 * 반려동물 자체는 mockHomeData를 그대로 쓴다. 목업 데이터가 둘로 갈리면 홈과
 * 상세가 다른 반려동물을 보여주게 된다.
 */

// HomeQuery가 조회하지 않는 필드만 여기서 채운다.
type PetExtraFields = Pick<
  PetDetailQuery['pet'],
  'gender' | 'weight' | 'isNeutered' | 'createdAt' | 'updatedAt'
>;

const EXTRA_FIELDS: Record<string, PetExtraFields> = {
  'pet-1': {
    gender: 'male',
    weight: 3.2,
    isNeutered: true,
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  },
  'pet-2': {
    gender: 'female',
    weight: 4.8,
    isNeutered: false,
    createdAt: '2026-02-11T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
  },
};

const FALLBACK_EXTRA: PetExtraFields = {
  gender: 'unknown',
  weight: null,
  isNeutered: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function findPet(id: string) {
  return mockHomeData.me?.pets.find((pet) => pet.id === id) ?? null;
}

/**
 * 실제 백엔드의 NotFoundException과 같은 모양으로 돌려준다.
 * 프론트의 isNotFoundError가 extensions.originalError.statusCode를 보므로,
 * 이 형태가 아니면 목업에서 "찾을 수 없음" 화면을 검증할 수 없다.
 */
function notFound() {
  return HttpResponse.json<GraphQLResponseBody<never>>({
    errors: [
      {
        message: '반려동물을 찾을 수 없습니다.',
        extensions: { originalError: { message: '반려동물을 찾을 수 없습니다.', statusCode: 404 } },
      },
    ],
  });
}

export const petHandlers = [
  graphql.query('PetDetail', ({ variables }) => {
    const pet = findPet(variables.id as string);
    if (!pet) return notFound();

    // 홈과 같은 규칙으로 목업 기록 추가분을 반영한다.
    const added = getMockRecentRecords(pet.id, 5);
    const data: PetDetailQuery = {
      pet: {
        ...(EXTRA_FIELDS[pet.id] ?? FALLBACK_EXTRA),
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birthDate,
        profileImageUrl: pet.profileImageUrl,
        recentWeight: pet.recentWeight,
        todayRecordCount: pet.todayRecordCount + getMockTodayCount(pet.id),
        recentHealthRecords: [...added, ...pet.recentHealthRecords].slice(0, 5),
      },
    };
    return HttpResponse.json({ data });
  }),

  graphql.query('PetEdit', ({ variables }) => {
    const pet = findPet(variables.id as string);
    if (!pet) return notFound();

    const extra = EXTRA_FIELDS[pet.id] ?? FALLBACK_EXTRA;
    const data: PetEditQuery = {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birthDate,
        gender: extra.gender,
        weight: extra.weight,
        isNeutered: extra.isNeutered,
        profileImageUrl: pet.profileImageUrl,
      },
    };
    return HttpResponse.json({ data });
  }),

  // 삭제 확인 다이얼로그가 "마지막 반려동물"인지 판단할 때 쓴다.
  graphql.query('PetIds', () =>
    HttpResponse.json({
      data: { pets: (mockHomeData.me?.pets ?? []).map((pet) => ({ id: pet.id })) },
    }),
  ),
];
