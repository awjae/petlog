import type { MedicationFrequency } from '@/generated/graphql';

export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency | null;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationFormInput {
  petId: string;
  name?: string;
  frequency?: MedicationFrequency;
  startDate: string;
  endDate?: string;
}

export const FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  onceDaily: '하루 1회',
  twiceDaily: '하루 2회',
  threeTimesDaily: '하루 3회',
  asNeeded: '필요시',
};

export const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABEL) as MedicationFrequency[]).map(
  (value) => ({ value, label: FREQUENCY_LABEL[value] }),
);
