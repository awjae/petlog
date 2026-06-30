import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { Medication } from '../types/medication.types';

interface MedicationsData {
  medications: Medication[];
}
interface MedicationsVars {
  petId: string;
}

export const MEDICATIONS_QUERY: TypedDocumentNode<MedicationsData, MedicationsVars> = gql`
  query Medications($petId: ID!) {
    medications(petId: $petId) {
      id
      petId
      name
      dosage
      frequency
      startDate
      endDate
      createdAt
      updatedAt
    }
  }
`;
