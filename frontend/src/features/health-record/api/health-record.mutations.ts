import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type {
  CreateHealthRecordMutation,
  CreateHealthRecordMutationVariables,
  DeleteHealthRecordMutation,
  DeleteHealthRecordMutationVariables,
} from '@/generated/graphql';

export const CREATE_HEALTH_RECORD_MUTATION: TypedDocumentNode<
  CreateHealthRecordMutation,
  CreateHealthRecordMutationVariables
> = gql`
  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {
    createHealthRecord(input: $input) {
      id
      type
      recordedAt
    }
  }
`;

export const DELETE_HEALTH_RECORD_MUTATION: TypedDocumentNode<
  DeleteHealthRecordMutation,
  DeleteHealthRecordMutationVariables
> = gql`
  mutation DeleteHealthRecord($id: ID!) {
    deleteHealthRecord(id: $id)
  }
`;
