import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type {
  UpdatePetMutation,
  UpdatePetMutationVariables,
  DeletePetMutation,
  DeletePetMutationVariables,
} from '@/generated/graphql';

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

export const UPDATE_PET_MUTATION: TypedDocumentNode<UpdatePetMutation, UpdatePetMutationVariables> =
  gql`
    mutation UpdatePet($id: ID!, $input: UpdatePetInput!) {
      updatePet(id: $id, input: $input) {
        id
        name
        species
        breed
        birthDate
        gender
        isNeutered
        profileImageUrl
      }
    }
  `;

export const DELETE_PET_MUTATION: TypedDocumentNode<DeletePetMutation, DeletePetMutationVariables> =
  gql`
    mutation DeletePet($id: ID!) {
      deletePet(id: $id)
    }
  `;
