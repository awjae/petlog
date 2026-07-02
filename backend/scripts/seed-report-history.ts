import 'dotenv/config';
import { PrismaClient, HealthRecordType } from '@prisma/client';

// seed-report-requirements.ts를 참고해, 리포트를 여러 번 생성/조회 테스트할 수 있도록
// 특정 petId에 최근 3개월(90일)치 건강 기록을 채워 넣는 스크립트.
// 실행: npm run seed:report-history --workspace=backend -- <petId>

const prisma = new PrismaClient();

const DEFAULT_PET_ID = 'a658a39a-0a92-465e-a91c-c3a92f9fcdde';
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 90;

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
  const earliestDay = new Date(todayUtc.getTime() - (PERIOD_DAYS - 1) * DAY_MS);

  if (pet.createdAt > earliestDay) {
    console.warn(
      `경고: 반려동물 등록일(${pet.createdAt.toISOString()})이 ${PERIOD_DAYS}일 전보다 늦습니다. ` +
        `periodStart는 등록일 이후여야 하므로, 등록일 이전 날짜의 기록은 리포트 생성 기간 선택에 활용되지 않습니다.`,
    );
  }

  const records: {
    petId: string;
    type: HealthRecordType;
    numValue?: number;
    textValue?: string;
    recordedAt: Date;
  }[] = [];

  for (let dayOffset = PERIOD_DAYS - 1; dayOffset >= 0; dayOffset--) {
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
    `pet(${petId})에 건강 기록 ${records.length}건 생성 완료 (${distinctDays.size}일 분산, 최근 ${PERIOD_DAYS}일).`,
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
