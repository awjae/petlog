export interface MedicalEvent {
  id: string;
  petId: string;
  hospitalName: string;
  visitDate: Date;
  description: string;
  attachmentUrl: string | null;
  createdAt: Date;
}

export type CreateMedicalEventInput = Pick<
  MedicalEvent,
  "hospitalName" | "visitDate" | "description"
> &
  Partial<Pick<MedicalEvent, "attachmentUrl">>;

export type UpdateMedicalEventInput = Partial<
  Pick<
    MedicalEvent,
    "hospitalName" | "visitDate" | "description" | "attachmentUrl"
  >
>;
