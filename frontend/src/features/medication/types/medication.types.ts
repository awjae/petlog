export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationFormInput {
  petId: string;
  name?: string;
  frequency?: string;
  startDate: string;
  endDate?: string;
}

export const FREQUENCY_OPTIONS = [
  { value: '하루 1회', label: '하루 1회' },
  { value: '하루 2회', label: '하루 2회' },
  { value: '하루 3회', label: '하루 3회' },
  { value: '필요시', label: '필요시' },
] as const;

export type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number]['value'];
