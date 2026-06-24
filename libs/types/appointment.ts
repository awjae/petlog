export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export interface Appointment {
  id: string;
  petId: string;
  hospitalName: string;
  scheduledAt: Date;
  reason: string | null;
  status: AppointmentStatus;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAppointmentInput = Pick<Appointment, 'hospitalName' | 'scheduledAt'> & {
  reason?: string;
  memo?: string;
};

export type UpdateAppointmentInput = Partial<
  Pick<Appointment, 'hospitalName' | 'scheduledAt' | 'reason' | 'status' | 'memo'>
>;
