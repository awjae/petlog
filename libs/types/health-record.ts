export enum HealthRecordType {
  Weight = 'weight',
  Appetite = 'appetite',
  Activity = 'activity',
  Symptom = 'symptom',
  Stool = 'stool',
  Vomit = 'vomit',
  Mood = 'mood',
}

export enum AppetiteLevel {
  None = 'none',
  Low = 'low',
  Normal = 'normal',
  High = 'high',
}

export enum ActivityLevel {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
}

// type별 값 저장 컬럼
// numValue: weight 등 수치 기록 (단위: Decimal)
// textValue: appetite, activity, symptom 등 문자열 기록
// 두 컬럼이 동시에 채워지지 않도록 서비스 레이어에서 type 기반 검증
export interface HealthRecord {
  id: string;
  petId: string;
  type: HealthRecordType;
  numValue: number | null;
  textValue: string | null;
  note: string | null;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateHealthRecordInput =
  | {
      type: HealthRecordType.Weight;
      numValue: number;
      textValue?: never;
      recordedAt: Date;
      note?: string;
    }
  | {
      type: Exclude<HealthRecordType, HealthRecordType.Weight>;
      numValue?: never;
      textValue: string;
      recordedAt: Date;
      note?: string;
    };

export type UpdateHealthRecordInput = Partial<
  Pick<HealthRecord, 'numValue' | 'textValue' | 'note' | 'recordedAt'>
>;
