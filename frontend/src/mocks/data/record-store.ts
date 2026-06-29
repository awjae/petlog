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
      summary: buildSummary(r),
    }));
}

export function getMockTodayCount(petId: string): number {
  const todayStr = new Date().toISOString().split('T')[0];
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

function buildSummary(r: StoredRecord): string {
  switch (r.type) {
    case 'weight':
      return r.numValue != null ? `${r.numValue} kg` : '';
    case 'appetite':
      return r.textValue ?? '';
    case 'activity': {
      const duration = r.numValue != null ? `${r.numValue}분` : '';
      const distance = r.textValue ? ` · ${r.textValue}km` : '';
      return duration + distance;
    }
    case 'mood':
      return r.textValue ?? '';
    default:
      return r.textValue ?? '';
  }
}
