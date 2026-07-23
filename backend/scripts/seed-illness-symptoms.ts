import 'dotenv/config';
import { PrismaClient, HealthRecordType } from '@prisma/client';

// 최근 7일간 악화되는 질병 증상(구토·설사·식욕부진·무기력 등) 패턴으로
// 건강 기록을 채워 넣는 스크립트. AI 리포트의 concerns/highlights 감지 테스트용.
// 실행: npm run seed:illness-symptoms --workspace=backend -- <petId>

const prisma = new PrismaClient();

const DEFAULT_PET_ID = 'c26bdf2b-f037-45d3-a704-b92865b7fe16';
const DAY_MS = 24 * 60 * 60 * 1000;

type RecordInput = {
  type: HealthRecordType;
  numValue?: number;
  textValue?: string;
  note?: string;
};

// dayOffset 6(일주일 전) -> 0(오늘) 순으로 증상이 점점 심해지는 흐름
const DAY_PLAN: Array<{ dayOffset: number; records: RecordInput[] }> = [
  {
    dayOffset: 6,
    records: [
      {
        type: HealthRecordType.symptom,
        textValue: '기력저하',
        numValue: 2,
        note: '평소보다 활동량이 줄어듦',
      },
      { type: HealthRecordType.appetite, textValue: '보통' },
    ],
  },
  {
    dayOffset: 5,
    records: [
      { type: HealthRecordType.symptom, textValue: '구토, 무기력', numValue: 3 },
      { type: HealthRecordType.vomit, numValue: 1 },
      { type: HealthRecordType.appetite, textValue: '감소' },
    ],
  },
  {
    dayOffset: 4,
    records: [
      { type: HealthRecordType.symptom, textValue: '식욕부진 지속', numValue: 3 },
      { type: HealthRecordType.mood, textValue: '처짐' },
      { type: HealthRecordType.stool, textValue: '묽음' },
    ],
  },
  {
    dayOffset: 3,
    records: [
      { type: HealthRecordType.symptom, textValue: '구토 반복', numValue: 4 },
      { type: HealthRecordType.vomit, numValue: 2 },
      { type: HealthRecordType.appetite, textValue: '거의 먹지 않음' },
    ],
  },
  {
    dayOffset: 2,
    records: [
      { type: HealthRecordType.symptom, textValue: '기력저하 심함', numValue: 4 },
      { type: HealthRecordType.mood, textValue: '무기력' },
      { type: HealthRecordType.weight, numValue: 3.8 },
    ],
  },
  {
    dayOffset: 1,
    records: [
      { type: HealthRecordType.symptom, textValue: '구토 및 설사', numValue: 4 },
      { type: HealthRecordType.vomit, numValue: 1 },
      { type: HealthRecordType.stool, textValue: '설사' },
    ],
  },
  {
    dayOffset: 0,
    records: [
      {
        type: HealthRecordType.symptom,
        textValue: '증상 지속, 병원 방문 필요',
        numValue: 5,
        note: '병원 방문 예정',
      },
      { type: HealthRecordType.appetite, textValue: '감소' },
      { type: HealthRecordType.mood, textValue: '무기력' },
    ],
  },
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
        `분석 기간(periodStart)은 등록일 이후여야 하므로, 이 기록으로 리포트를 생성하려면 ` +
        `등록일을 7일 이상 이전으로 조정해야 할 수 있습니다.`,
    );
  }

  const records: {
    petId: string;
    type: HealthRecordType;
    numValue?: number;
    textValue?: string;
    note?: string;
    recordedAt: Date;
  }[] = [];

  for (const { dayOffset, records: dayRecords } of DAY_PLAN) {
    const baseAt = new Date(todayUtc.getTime() - dayOffset * DAY_MS);

    dayRecords.forEach((record, index) => {
      const recordedAt = new Date(baseAt.getTime());
      recordedAt.setUTCHours(9 + index * 4, 0, 0, 0);
      records.push({ petId, ...record, recordedAt });
    });
  }

  await prisma.healthRecord.createMany({ data: records });

  const distinctDays = new Set(records.map((r) => r.recordedAt.toISOString().slice(0, 10)));
  console.log(
    `pet(${petId})에 질병 증상 기록 ${records.length}건 생성 완료 (${distinctDays.size}일 분산, 최근 7일).`,
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
