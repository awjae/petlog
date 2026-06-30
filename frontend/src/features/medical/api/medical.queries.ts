import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { MedicalEvent, Vaccination, Appointment } from '../types/medical.types';

interface MedicalEventsData {
  medicalEvents: MedicalEvent[];
}
interface MedicalEventsVars {
  petId: string;
}

export const MEDICAL_EVENTS_QUERY: TypedDocumentNode<MedicalEventsData, MedicalEventsVars> = gql`
  query MedicalEvents($petId: ID!) {
    medicalEvents(petId: $petId) {
      id
      petId
      hospitalName
      visitDate
      description
      attachmentUrls
      createdAt
      updatedAt
    }
  }
`;

interface VaccinationsData {
  vaccinations: Vaccination[];
}
interface VaccinationsVars {
  petId: string;
}

export const VACCINATIONS_QUERY: TypedDocumentNode<VaccinationsData, VaccinationsVars> = gql`
  query Vaccinations($petId: ID!) {
    vaccinations(petId: $petId) {
      id
      petId
      name
      code
      vaccinatedAt
      nextDueAt
      memo
      createdAt
      updatedAt
    }
  }
`;

interface AppointmentsData {
  appointments: Appointment[];
}
interface AppointmentsVars {
  petId: string;
}

export const APPOINTMENTS_QUERY: TypedDocumentNode<AppointmentsData, AppointmentsVars> = gql`
  query Appointments($petId: ID!) {
    appointments(petId: $petId) {
      id
      petId
      hospitalName
      scheduledAt
      reason
      status
      memo
      createdAt
      updatedAt
    }
  }
`;
