export interface MedicalEvent {
  id: string;
  petId: string;
  hospitalName: string;
  visitDate: Date;
  description: string;
  attachmentUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMedicalEventInput = Pick<
  MedicalEvent,
  'hospitalName' | 'visitDate' | 'description'
> & { attachmentUrls?: string[] };

export type UpdateMedicalEventInput = Partial<
  Pick<MedicalEvent, 'hospitalName' | 'visitDate' | 'description' | 'attachmentUrls'>
>;
