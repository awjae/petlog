import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { MedicationFrequency } from '@/generated/graphql';

interface CreateMedicationInput {
  petId: string;
  name?: string;
  dosage?: string;
  frequency?: MedicationFrequency;
  startDate: string;
  endDate?: string;
}
interface CreateMedicationData {
  createMedication: { id: string; name: string; startDate: string };
}
export const CREATE_MEDICATION_MUTATION: TypedDocumentNode<
  CreateMedicationData,
  { input: CreateMedicationInput }
> = gql`
  mutation CreateMedication($input: CreateMedicationInput!) {
    createMedication(input: $input) {
      id
      name
      startDate
    }
  }
`;

interface DeleteMedicationData {
  deleteMedication: boolean;
}
export const DELETE_MEDICATION_MUTATION: TypedDocumentNode<DeleteMedicationData, { id: string }> =
  gql`
    mutation DeleteMedication($id: ID!) {
      deleteMedication(id: $id)
    }
  `;

// 복용 중인 약을 오늘로 끝낼 때만 쓴다. 다른 필드는 바꾸지 않는다.
interface EndMedicationData {
  updateMedication: { id: string; endDate: string | null };
}
export const END_MEDICATION_MUTATION: TypedDocumentNode<
  EndMedicationData,
  { id: string; input: { endDate: string } }
> = gql`
  mutation EndMedication($id: ID!, $input: UpdateMedicationInput!) {
    updateMedication(id: $id, input: $input) {
      id
      endDate
    }
  }
`;
