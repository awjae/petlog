import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

// 식사 기록의 선택지. 입력 계약의 일부라 화면이 아니라 여기서 정의한다.
export type AppetiteLevel = 'good' | 'normal' | 'bad';

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
