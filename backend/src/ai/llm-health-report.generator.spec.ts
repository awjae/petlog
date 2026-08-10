import { HealthRecordType } from '@prisma/client';
import type { ChatGptHealthReportClient, HealthReportInput } from '@petlog/ai';
import { LlmHealthReportGenerator } from './llm-health-report.generator';
import { BreedProfileService } from './breed-profile.service';
import { PrismaService } from '../common/prisma/prisma.service';
import type { HealthReportGenerationParams } from './health-report-generator.interface';

/**
 * buildInput은 HealthRecord(범용 numValue/textValue 칸)를 ChatGPT 입력 스키마로 옮기는
 * 변환 로직이다. 여기서 값이 잘못 실려도 예외는 나지 않는다 — 근거 없는 문장이 담긴
 * 리포트가 사용자에게 그대로 나갈 뿐이라, 조용히 틀리는 쪽에 속한다.
 *
 * private 메서드를 직접 찌르지 않고, generate()가 클라이언트에 실제로 넘기는 입력을
 * 확인한다. 검증 대상은 "AI에게 무엇을 보냈는가"이므로 그 경계에서 보는 것이 맞다.
 */
describe('LlmHealthReportGenerator buildInput', () => {
  const PET_ID = 'pet-1';
  const PERIOD_START = new Date('2026-06-01T00:00:00Z');
  const PERIOD_END = new Date('2026-06-30T00:00:00Z');

  const params = (overrides: Partial<HealthReportGenerationParams> = {}) =>
    ({
      petId: PET_ID,
      petName: '초코',
      species: 'dog',
      breed: null,
      birthDate: null,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      recordCount: 10,
      recordDays: 7,
      ...overrides,
    }) as HealthReportGenerationParams;

  type Record = {
    type: HealthRecordType;
    numValue: number | null;
    textValue: string | null;
    note: string | null;
  };

  const record = (type: HealthRecordType, o: Partial<Record> = {}): Record => ({
    type,
    numValue: null,
    textValue: null,
    note: null,
    ...o,
  });

  let generateReport: jest.Mock;

  function build(opts: {
    records?: Record[];
    medications?: { name: string | null }[];
    lastVisit?: { visitDate: Date } | null;
  }) {
    const prisma = {
      healthRecord: { findMany: jest.fn().mockResolvedValue(opts.records ?? []) },
      medication: { findMany: jest.fn().mockResolvedValue(opts.medications ?? []) },
      medicalEvent: { findFirst: jest.fn().mockResolvedValue(opts.lastVisit ?? null) },
    };

    generateReport = jest.fn().mockResolvedValue({
      summary: '요약',
      trends: [],
      concerns: [],
      actions: [],
    });

    const generator = new LlmHealthReportGenerator(
      { generateReport } as unknown as ChatGptHealthReportClient,
      prisma as unknown as PrismaService,
      new BreedProfileService(),
    );

    return { generator, prisma };
  }

  const sentInput = (): HealthReportInput => generateReport.mock.calls[0][0] as HealthReportInput;

  it('체중은 numValue만 모으고 값이 없는 기록은 버린다', async () => {
    const { generator } = build({
      records: [
        record(HealthRecordType.weight, { numValue: 4.2 }),
        record(HealthRecordType.weight, { numValue: null }),
        record(HealthRecordType.weight, { numValue: 4.5 }),
      ],
    });

    await generator.generate(params());

    expect(sentInput().records.weight).toEqual([4.2, 4.5]);
  });

  // 식사 기록은 화면 표시 문자열이 그대로 저장된다. 알 수 없는 문자열을 임의의 등급으로
  // 채우면 근거 없는 서술이 나가므로 버리는 것이 맞다.
  it('식사 기록은 인식 가능한 표시 문자열만 등급으로 옮긴다', async () => {
    const { generator } = build({
      records: [
        record(HealthRecordType.appetite, { textValue: '잘 먹음' }),
        record(HealthRecordType.appetite, { textValue: '보통' }),
        record(HealthRecordType.appetite, { textValue: '알 수 없는 값' }),
        record(HealthRecordType.appetite, { textValue: null }),
      ],
    });

    await generator.generate(params());

    expect(sentInput().records.appetite).toEqual(['good', 'normal']);
  });

  // 산책 기록은 numValue=시간, textValue=거리라 등급이 아니다. 거리 문자열이 등급인 척
  // 넘어가면 안 된다.
  it('산책 기록의 거리 문자열은 활동 등급으로 넘기지 않는다', async () => {
    const { generator } = build({
      records: [
        record(HealthRecordType.activity, { numValue: 30, textValue: '3.5' }),
        record(HealthRecordType.activity, { textValue: 'high' }),
      ],
    });

    await generator.generate(params());

    expect(sentInput().records.activity).toEqual(['high']);
  });

  it('증상과 구토를 한 목록으로 합치고 note를 우선한다', async () => {
    const { generator } = build({
      records: [
        record(HealthRecordType.symptom, { textValue: '기침', note: '밤에 심함' }),
        record(HealthRecordType.symptom, { textValue: '설사' }),
        record(HealthRecordType.vomit, { numValue: 2, note: '사료 먹고 바로' }),
        record(HealthRecordType.vomit, { numValue: 1 }),
        record(HealthRecordType.weight, { numValue: 4.2 }),
      ],
    });

    await generator.generate(params());

    expect(sentInput().symptoms).toEqual(['밤에 심함', '설사', '사료 먹고 바로']);
  });

  it('이름 없는 투약은 목록에서 뺀다', async () => {
    const { generator } = build({
      medications: [{ name: '심장사상충약' }, { name: null }, { name: '항생제' }],
    });

    await generator.generate(params());

    expect(sentInput().medications).toEqual(['심장사상충약', '항생제']);
  });

  it('마지막 병원 방문이 없으면 null을 보낸다', async () => {
    const { generator } = build({ lastVisit: null });

    await generator.generate(params());

    expect(sentInput().last_vet_visit).toBeNull();
  });

  it('마지막 병원 방문은 날짜만 보낸다', async () => {
    const { generator } = build({ lastVisit: { visitDate: new Date('2026-05-20T09:30:00Z') } });

    await generator.generate(params());

    expect(sentInput().last_vet_visit).toBe('2026-05-20');
  });

  describe('나이 계산', () => {
    it('생일이 없으면 0개월로 보낸다', async () => {
      const { generator } = build({});

      await generator.generate(params({ birthDate: null }));

      expect(sentInput().pet.age_months).toBe(0);
    });

    it('기간 종료일 기준으로 개월 수를 센다', async () => {
      const { generator } = build({});

      await generator.generate(params({ birthDate: new Date('2024-06-15T00:00:00Z') }));

      // 2024-06 → 2026-06 = 24개월
      expect(sentInput().pet.age_months).toBe(24);
    });
  });

  it('기간을 날짜 문자열로 보낸다', async () => {
    const { generator } = build({});

    await generator.generate(params());

    expect(sentInput().period).toEqual({ start: '2026-06-01', end: '2026-06-30' });
  });

  it('조회 구간과 소프트 삭제 필터를 기간에 맞춰 건다', async () => {
    const { generator, prisma } = build({});

    await generator.generate(params());

    const { where } = prisma.healthRecord.findMany.mock.calls[0][0] as {
      where: { petId: string; deletedAt: null; recordedAt: { gte: Date; lte: Date } };
    };
    expect(where).toMatchObject({
      petId: PET_ID,
      deletedAt: null,
      recordedAt: { gte: PERIOD_START, lte: PERIOD_END },
    });
  });

  // 리포트 기간에 걸쳐 있으면 기간 밖에서 시작했거나 아직 안 끝난 투약도 대상이다.
  it('기간에 걸친 투약을 모두 대상으로 조회한다', async () => {
    const { generator, prisma } = build({});

    await generator.generate(params());

    const { where } = prisma.medication.findMany.mock.calls[0][0] as {
      where: { startDate: { lte: Date }; OR: unknown[] };
    };
    expect(where.startDate).toEqual({ lte: PERIOD_END });
    expect(where.OR).toEqual([{ endDate: null }, { endDate: { gte: PERIOD_START } }]);
  });

  it('OPENAI_API_KEY가 없어 클라이언트가 없으면 생성을 시도하지 않는다', async () => {
    const generator = new LlmHealthReportGenerator(
      null,
      {} as unknown as PrismaService,
      new BreedProfileService(),
    );

    await expect(generator.generate(params())).rejects.toThrow(/OPENAI_API_KEY/);
  });
});
