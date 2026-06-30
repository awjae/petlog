import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface CreateMedicalEventInput {
  petId: string;
  hospitalName: string;
  visitDate: string;
  description: string;
  attachmentUrls?: string[];
}
interface CreateMedicalEventData {
  createMedicalEvent: { id: string; visitDate: string; hospitalName: string };
}
export const CREATE_MEDICAL_EVENT_MUTATION: TypedDocumentNode<
  CreateMedicalEventData,
  { input: CreateMedicalEventInput }
> = gql`
  mutation CreateMedicalEvent($input: CreateMedicalEventInput!) {
    createMedicalEvent(input: $input) {
      id
      visitDate
      hospitalName
    }
  }
`;

interface DeleteMedicalEventData {
  deleteMedicalEvent: boolean;
}
export const DELETE_MEDICAL_EVENT_MUTATION: TypedDocumentNode<
  DeleteMedicalEventData,
  { id: string }
> = gql`
  mutation DeleteMedicalEvent($id: ID!) {
    deleteMedicalEvent(id: $id)
  }
`;

interface CreateVaccinationInput {
  petId: string;
  name?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  memo?: string;
}
interface CreateVaccinationData {
  createVaccination: { id: string; name: string; vaccinatedAt: string };
}
export const CREATE_VACCINATION_MUTATION: TypedDocumentNode<
  CreateVaccinationData,
  { input: CreateVaccinationInput }
> = gql`
  mutation CreateVaccination($input: CreateVaccinationInput!) {
    createVaccination(input: $input) {
      id
      name
      vaccinatedAt
    }
  }
`;

interface DeleteVaccinationData {
  deleteVaccination: boolean;
}
export const DELETE_VACCINATION_MUTATION: TypedDocumentNode<DeleteVaccinationData, { id: string }> =
  gql`
    mutation DeleteVaccination($id: ID!) {
      deleteVaccination(id: $id)
    }
  `;

interface CreateAppointmentInput {
  petId: string;
  hospitalName: string;
  scheduledAt: string;
  reason?: string;
  memo?: string;
}
interface CreateAppointmentData {
  createAppointment: { id: string; hospitalName: string; scheduledAt: string };
}
export const CREATE_APPOINTMENT_MUTATION: TypedDocumentNode<
  CreateAppointmentData,
  { input: CreateAppointmentInput }
> = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      hospitalName
      scheduledAt
    }
  }
`;

interface DeleteAppointmentData {
  deleteAppointment: boolean;
}
export const DELETE_APPOINTMENT_MUTATION: TypedDocumentNode<DeleteAppointmentData, { id: string }> =
  gql`
    mutation DeleteAppointment($id: ID!) {
      deleteAppointment(id: $id)
    }
  `;
