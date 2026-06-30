export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface MedicalEvent {
  id: string;
  petId: string;
  hospitalName: string;
  visitDate: string;
  description: string;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  petId: string;
  name: string;
  code?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  petId: string;
  hospitalName: string;
  scheduledAt: string;
  reason?: string;
  status: AppointmentStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicalHubTab = 'visits' | 'vaccinations' | 'appointments';

export interface CreateMedicalEventFormInput {
  petId: string;
  hospitalName: string;
  visitDate: string;
  description: string;
}

export interface CreateVaccinationFormInput {
  petId: string;
  name?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  memo?: string;
}

export interface CreateAppointmentFormInput {
  petId: string;
  hospitalName: string;
  scheduledAt: string;
  reason?: string;
  memo?: string;
}

export const VACCINE_OPTIONS = [
  { value: '종합백신 DHPPL', label: '종합백신 DHPPL' },
  { value: '광견병', label: '광견병' },
  { value: '켄넬코프', label: '켄넬코프' },
  { value: '심장사상충', label: '심장사상충' },
  { value: '기타', label: '기타 (직접 입력)' },
] as const;

export type VaccineOption = (typeof VACCINE_OPTIONS)[number]['value'];
