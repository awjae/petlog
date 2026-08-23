'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_PET_MUTATION, type Gender, type Species } from '../api/pet.mutations';
import { uploadImage, UploadError } from '../api/pet.upload';

export interface CreatePetFormInput {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  gender: Gender | null;
  isNeutered: boolean;
  imageFile?: File | null;
}

export function useCreatePet() {
  const [uploading, setUploading] = useState(false);

  const [mutate, { loading: mutating }] = useMutation(CREATE_PET_MUTATION, {
    refetchQueries: ['HomeQuery'],
  });

  const loading = uploading || mutating;

  /** 성공하면 null, 실패하면 사용자에게 보여줄 사유를 돌려준다. */
  async function createPet(input: CreatePetFormInput): Promise<string | null> {
    let profileImageUrl: string | undefined;
    if (input.imageFile) {
      setUploading(true);
      try {
        profileImageUrl = await uploadImage(input.imageFile);
      } catch (err) {
        setUploading(false);
        return err instanceof UploadError ? err.message : '이미지 업로드에 실패했어요';
      }
      setUploading(false);
    }

    const result = await mutate({
      variables: {
        input: {
          name: input.name,
          species: input.species,
          breed: input.breed || undefined,
          birthDate: input.birthDate
            ? new Date(input.birthDate + 'T12:00:00').toISOString()
            : undefined,
          gender: input.gender ?? 'unknown',
          isNeutered: input.isNeutered,
          profileImageUrl,
        },
      },
    }).catch(() => null);

    return result?.data?.createPet != null ? null : '등록에 실패했어요. 다시 시도해주세요';
  }

  return { createPet, loading };
}
