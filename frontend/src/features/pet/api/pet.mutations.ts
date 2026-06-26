import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export type Gender = 'male' | 'female' | 'unknown';
export type Species = 'dog' | 'cat';

interface CreatePetInput {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  gender: Gender;
  weight?: number;
  isNeutered?: boolean;
  profileImageUrl?: string;
}

interface CreatePetData {
  createPet: { id: string; name: string; species: Species };
}

export const CREATE_PET_MUTATION: TypedDocumentNode<CreatePetData, { input: CreatePetInput }> = gql`
  mutation CreatePet($input: CreatePetInput!) {
    createPet(input: $input) {
      id
      name
      species
    }
  }
`;
