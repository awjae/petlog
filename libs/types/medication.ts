export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
}

export type CreateMedicationInput = Pick<
  Medication,
  "name" | "dosage" | "frequency" | "startDate"
> &
  Partial<Pick<Medication, "endDate">>;

export type UpdateMedicationInput = Partial<
  Pick<Medication, "name" | "dosage" | "frequency" | "startDate" | "endDate">
>;
