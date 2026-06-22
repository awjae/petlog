export enum Species {
  Dog = "dog",
  Cat = "cat",
}

export enum Gender {
  Male = "male",
  Female = "female",
  Unknown = "unknown",
}

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: Date | null;
  gender: Gender;
  weight: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePetInput = Pick<Pet, "name" | "species" | "gender"> &
  Partial<Pick<Pet, "breed" | "birthDate" | "weight">>;

export type UpdatePetInput = Partial<
  Pick<Pet, "name" | "species" | "breed" | "birthDate" | "gender" | "weight">
>;
