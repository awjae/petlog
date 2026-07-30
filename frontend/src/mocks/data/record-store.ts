import { localToday } from '@/shared/utils/date';

type StoredRecord = {
  id: string;
  petId: string;
  type: string;
  recordedAt: string;
  numValue?: number;
  textValue?: string;
};

const records: StoredRecord[] = [];

export function addMockRecord(record: StoredRecord) {
  records.unshift(record);
}

export function getMockRecentRecords(petId: string, limit: number) {
  return records
    .filter((r) => r.petId === petId)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      type: r.type,
      recordedAt: r.recordedAt,
      numValue: r.numValue ?? null,
      textValue: r.textValue ?? null,
    }));
}

export function getMockTodayCount(petId: string): number {
  const todayStr = localToday();
  return records.filter((r) => r.petId === petId && r.recordedAt.startsWith(todayStr)).length;
}

export function getAllMockRecords(petId: string) {
  return records
    .filter((r) => r.petId === petId)
    .map((r) => ({
      id: r.id,
      type: r.type,
      recordedAt: r.recordedAt,
      numValue: r.numValue ?? null,
      textValue: r.textValue ?? null,
      note: null,
    }));
}
