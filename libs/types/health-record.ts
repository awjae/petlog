export enum HealthRecordType {
  Weight = "weight",
  Appetite = "appetite",
  Activity = "activity",
  Symptom = "symptom",
  Stool = "stool",
  Vomit = "vomit",
  Mood = "mood",
}

export enum AppetiteLevel {
  None = "none",
  Low = "low",
  Normal = "normal",
  High = "high",
}

export enum ActivityLevel {
  Low = "low",
  Normal = "normal",
  High = "high",
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: HealthRecordType;
  value: string;
  note: string | null;
  recordedAt: Date;
  createdAt: Date;
}

export type CreateHealthRecordInput = Pick<
  HealthRecord,
  "type" | "value" | "recordedAt"
> &
  Partial<Pick<HealthRecord, "note">>;
