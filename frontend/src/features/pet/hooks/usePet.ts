'use client';

import { useQuery } from '@apollo/client/react';
import { PET_DETAIL_QUERY, PET_EDIT_QUERY, PET_IDS_QUERY } from '../api/pet.queries';
import { isNotFoundError } from '../api/pet.errors';

export function usePetDetail(petId: string) {
  const { data, loading, error, refetch } = useQuery(PET_DETAIL_QUERY, {
    variables: { id: petId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    skip: !petId,
  });

  return {
    pet: data?.pet ?? null,
    loading,
    error,
    notFound: isNotFoundError(error),
    refetch,
  };
}

export function usePetEdit(petId: string) {
  const { data, loading, error } = useQuery(PET_EDIT_QUERY, {
    variables: { id: petId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    skip: !petId,
  });

  return {
    pet: data?.pet ?? null,
    loading,
    error,
    notFound: isNotFoundError(error),
  };
}

// 삭제 확인 다이얼로그에서 "마지막 반려동물" 여부를 판단하기 위한 경량 조회
export function usePetIds() {
  const { data, loading } = useQuery(PET_IDS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    petCount: data?.pets.length ?? null,
    loading,
  };
}
