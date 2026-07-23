import 'dotenv/config';
import { PrismaClient, HealthRecordType } from '@prisma/client';

// 리포트 생성 요건(MIN_RECORD_COUNT=10, MIN_RECORD_DAYS=7, report.service.ts)을
// 충족시키기 위해 특정 petId에 최근 7일간 건강 기록을 채워 넣는 스크립트.
// 실행: npm run seed:report-requirements --workspace=backend -- <petId>

const prisma = new PrismaClient();

const DEFAULT_PET_ID = 'c26bdf2b-f037-45d3-a704-b92865b7fe16';
const DAY_MS = 24 * 60 * 60 * 1000;

const RECORD_PRESETS: Array<{
  type: HealthRecordType;
  numValue?: number;
  textValue?: string;
}> = [
  { type: HealthRecordType.weight, numValue: 4.2 },
  { type: HealthRecordType.appetite, textValue: '보통' },
  { type: HealthRecordType.activity, numValue: 1.5 },
  { type: HealthRecordType.symptom, textValue: '없음', numValue: 1 },
  { type: HealthRecordType.stool, textValue: '정상' },
  { type: HealthRecordType.vomit, numValue: 0 },
  { type: HealthRecordType.mood, textValue: '활발' },
];

async function main() {
  const petId = process.argv[2] ?? DEFAULT_PET_ID;

  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) {
    throw new Error(`petId를 가진 반려동물을 찾을 수 없습니다: ${petId}`);
  }

  const todayUtc = new Date();
  todayUtc.setUTCHours(9, 0, 0, 0);
  const earliestDay = new Date(todayUtc.getTime() - 6 * DAY_MS);

  if (pet.createdAt > earliestDay) {
    console.warn(
      `경고: 반려동물 등록일(${pet.createdAt.toISOString()})이 최근 7일 이내입니다. ` +
        `분석 기간(periodStart)은 등록일 이후여야 하므로, 오늘부터 등록일까지의 기간만으로는 ` +
        `7일 요건을 만족하지 못할 수 있습니다.`,
    );
  }

  const records: {
    petId: string;
    type: HealthRecordType;
    numValue?: number;
    textValue?: string;
    recordedAt: Date;
  }[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const morningAt = new Date(todayUtc.getTime() - dayOffset * DAY_MS);
    const eveningAt = new Date(morningAt.getTime());
    eveningAt.setUTCHours(18, 0, 0, 0);

    const morningPreset = RECORD_PRESETS[dayOffset % RECORD_PRESETS.length];
    const eveningPreset = RECORD_PRESETS[(dayOffset + 3) % RECORD_PRESETS.length];

    records.push({ petId, ...morningPreset, recordedAt: morningAt });
    records.push({ petId, ...eveningPreset, recordedAt: eveningAt });
  }

  await prisma.healthRecord.createMany({ data: records });

  const distinctDays = new Set(records.map((r) => r.recordedAt.toISOString().slice(0, 10)));
  console.log(
    `pet(${petId})에 건강 기록 ${records.length}건 생성 완료 (${distinctDays.size}일 분산).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
