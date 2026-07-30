import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export type HealthRecordType =
  | 'weight'
  | 'appetite'
  | 'activity'
  | 'mood'
  | 'stool'
  | 'symptom'
  | 'vomit';

interface CreateHealthRecordInput {
  petId: string;
  type: HealthRecordType;
  recordedAt: string;
  numValue?: number;
  textValue?: string;
  note?: string;
}

interface CreateHealthRecordData {
  createHealthRecord: { id: string; type: HealthRecordType; recordedAt: string };
}

export const CREATE_HEALTH_RECORD_MUTATION: TypedDocumentNode<
  CreateHealthRecordData,
  { input: CreateHealthRecordInput }
> = gql`
  mutation CreateHealthRecord($input: CreateHealthRecordInput!) {
    createHealthRecord(input: $input) {
      id
      type
      recordedAt
    }
  }
`;
