import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type {
  PetDetailQuery,
  PetDetailQueryVariables,
  PetEditQuery,
  PetEditQueryVariables,
  PetIdsQuery,
  PetIdsQueryVariables,
} from '@/generated/graphql';

export const PET_DETAIL_QUERY: TypedDocumentNode<PetDetailQuery, PetDetailQueryVariables> = gql`
  query PetDetail($id: ID!) {
    pet(id: $id) {
      id
      name
      species
      breed
      birthDate
      gender
      weight
      isNeutered
      profileImageUrl
      recentWeight {
        value
        recordedAt
      }
      todayRecordCount
      recentHealthRecords(limit: 5) {
        id
        type
        recordedAt
        summary
      }
      createdAt
      updatedAt
    }
  }
`;

export const PET_EDIT_QUERY: TypedDocumentNode<PetEditQuery, PetEditQueryVariables> = gql`
  query PetEdit($id: ID!) {
    pet(id: $id) {
      id
      name
      species
      breed
      birthDate
      gender
      weight
      isNeutered
      profileImageUrl
    }
  }
`;

// 삭제 확인 다이얼로그에서 "마지막 반려동물" 여부 판단용 경량 쿼리
export const PET_IDS_QUERY: TypedDocumentNode<PetIdsQuery, PetIdsQueryVariables> = gql`
  query PetIds {
    pets {
      id
    }
  }
`;
