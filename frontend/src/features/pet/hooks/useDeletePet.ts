'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { DELETE_PET_MUTATION } from '../api/pet.mutations';
import { useSelectedPetStore } from '@/features/pet/stores/selectedPet.store';

export function useDeletePet() {
  const [error, setError] = useState('');

  const [mutate, { loading }] = useMutation(DELETE_PET_MUTATION, {
    refetchQueries: ['HomeQuery'],
  });

  async function deletePet(petId: string): Promise<boolean> {
    setError('');

    const result = await mutate({ variables: { id: petId } }).catch(() => null);
    const ok = result?.data?.deletePet === true;

    if (ok) {
      useSelectedPetStore.getState().clearSelectedPetId(petId);
    } else {
      setError('삭제하지 못했어요. 다시 시도해주세요.');
    }

    return ok;
  }

  return { deletePet, loading, error };
}
