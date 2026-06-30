import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface CreateMedicationInput {
  petId: string;
  name?: string;
  dosage?: string;
  frequency?: string;
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
