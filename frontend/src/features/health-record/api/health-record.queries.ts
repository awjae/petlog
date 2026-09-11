import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { HealthRecordsQuery, HealthRecordsQueryVariables } from '@/generated/graphql';

export const HEALTH_RECORDS_QUERY: TypedDocumentNode<
  HealthRecordsQuery,
  HealthRecordsQueryVariables
> = gql`
  query HealthRecords($petId: ID!, $type: HealthRecordType) {
    healthRecords(petId: $petId, type: $type) {
      id
      type
      recordedAt
      numValue
      textValue
      note
    }
  }
`;
