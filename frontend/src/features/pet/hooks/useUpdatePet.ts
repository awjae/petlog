'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PET_MUTATION, type Gender, type Species } from '../api/pet.mutations';
import { uploadImage, UploadError } from '../api/pet.upload';

export interface UpdatePetFormInput {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  gender: Gender | null;
  isNeutered: boolean;
  imageFile?: File | null;
  existingProfileImageUrl?: string | null;
}

export function useUpdatePet() {
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [mutate, { loading: mutating }] = useMutation(UPDATE_PET_MUTATION, {
    refetchQueries: ['HomeQuery'],
    onError: () => setError('정보를 저장하지 못했어요. 다시 시도해주세요.'),
  });

  const loading = uploading || mutating;

  async function updatePet(petId: string, input: UpdatePetFormInput): Promise<boolean> {
    setError('');

    let profileImageUrl: string | undefined | null = input.existingProfileImageUrl;
    if (input.imageFile) {
      setUploading(true);
      try {
        profileImageUrl = await uploadImage(input.imageFile);
      } catch (err) {
        setError(err instanceof UploadError ? err.message : '이미지 업로드에 실패했어요');
        setUploading(false);
        return false;
      }
      setUploading(false);
    }

    const result = await mutate({
      variables: {
        id: petId,
        input: {
          name: input.name,
          species: input.species,
          breed: input.breed || undefined,
          birthDate: input.birthDate
            ? new Date(input.birthDate + 'T12:00:00').toISOString()
            : undefined,
          gender: input.gender ?? 'unknown',
          isNeutered: input.isNeutered,
          profileImageUrl: profileImageUrl ?? undefined,
        },
      },
    }).catch(() => null);

    return result?.data?.updatePet != null;
  }

  return { updatePet, loading, error };
}
