import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type {
  CreateHealthRecordMutation,
  CreateHealthRecordMutationVariables,
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
