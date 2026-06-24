export interface Vaccination {
  id: string;
  petId: string;
  name: string;
  code: string | null;
  vaccinatedAt: Date;
  nextDueAt: Date | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVaccinationInput = Pick<Vaccination, 'name' | 'vaccinatedAt'> & {
  code?: string;
  nextDueAt?: Date;
  memo?: string;
};

export type UpdateVaccinationInput = Partial<
  Pick<Vaccination, 'name' | 'code' | 'vaccinatedAt' | 'nextDueAt' | 'memo'>
>;
