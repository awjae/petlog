import { Species } from '@prisma/client';
import { BreedProfileService } from './breed-profile.service';
import { MockHealthReportGenerator } from './mock-health-report.generator';
import { LlmHealthReportGenerator } from './llm-health-report.generator';
import type { PrismaService } from '../common/prisma/prisma.service';
import type { ChatGptHealthReportClient } from '@petlog/ai';
import type {
  HealthReportGenerationParams,
  ReportContent,
} from './health-report-generator.interface';

// 나이 계산이 오늘 기준이라(BreedProfileService.calculateAgeMonths) 시간을 고정한다.
const TODAY = new Date('2026-08-10T00:00:00Z');

const SENIOR_BIRTH = new Date('2016-01-15T00:00:00Z');
const ADULT_BIRTH = new Date('2022-01-15T00:00:00Z');

const emptyContent = (): ReportContent => ({
  overview: '본문',
  highlights: ['기존 하이라이트'],
  concerns: ['기존 우려'],
  recommendations: ['기존 권장'],
});

const baseParams = {
  petId: 'pet-1',
  petName: '초코',
  species: Species.dog,
  breed: null,
  birthDate: null,
  periodStart: new Date('2026-06-01T00:00:00Z'),
  periodEnd: new Date('2026-06-30T00:00:00Z'),
  recordCount: 12,
  recordDays: 8,
} satisfies HealthReportGenerationParams;

const params = (o: Partial<HealthReportGenerationParams> = {}): HealthReportGenerationParams => ({
  ...baseParams,
  ...o,
});

describe('BreedProfileService.mergeIntoReport', () => {
  let service: BreedProfileService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(TODAY);
    service = new BreedProfileService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('생성기가 만든 본문을 지우지 않고 덧붙이기만 한다', () => {
    const merged = service.mergeIntoReport(
      emptyContent(),
      params({ breed: '말티즈', birthDate: SENIOR_BIRTH }),
    );

    expect(merged.overview).toBe('본문');
    expect(merged.highlights[0]).toBe('기존 하이라이트');
    expect(merged.concerns[0]).toBe('기존 우려');
    expect(merged.recommendations[0]).toBe('기존 권장');
  });

  it('품종이 없으면 아무것도 덧붙이지 않는다', () => {
    const merged = service.mergeIntoReport(emptyContent(), params({ birthDate: SENIOR_BIRTH }));

    expect(merged).toEqual(emptyContent());
  });

  it('노령기면 하이라이트에 권장 검진 주기를 덧붙인다', () => {
    const merged = service.mergeIntoReport(
      emptyContent(),
      params({ breed: '말티즈', birthDate: SENIOR_BIRTH }),
    );

    expect(merged.highlights).toContain('초코는 노령기에 접어들었어요. 반기 1회을 권장해요');
  });

  it('노령기가 아니면 생애주기 문구를 덧붙이지 않는다', () => {
    const merged = service.mergeIntoReport(
      emptyContent(),
      params({ breed: '말티즈', birthDate: ADULT_BIRTH }),
    );

    expect(merged.highlights).toEqual(['기존 하이라이트']);
  });

  // high는 우려로, medium은 권장으로 간다. 한 질환이 양쪽에 중복되면 안 된다.
  it('위험도 high는 우려로, medium은 권장으로 나눈다', () => {
    const merged = service.mergeIntoReport(
      emptyContent(),
      params({ breed: '말티즈', birthDate: SENIOR_BIRTH }),
    );

    const addedConcerns = merged.concerns.slice(1);
    const addedRecommendations = merged.recommendations.slice(1);

    // 문구를 파싱해 질환명을 되짚지 않고, 실제 alert 데이터와 직접 대조한다.
    const alerts = service.getBreedAlerts('dog', '말티즈', SENIOR_BIRTH);
    const conditionsOf = (level: 'high' | 'medium') =>
      alerts.filter((a) => a.risk_level === level).map((a) => a.condition);

    const high = conditionsOf('high');
    const medium = conditionsOf('medium');
    expect(high.length).toBeGreaterThan(0);
    expect(medium.length).toBeGreaterThan(0);

    const mentions = (lines: string[], condition: string) =>
      lines.some((l) => l.includes(condition));

    for (const condition of high) {
      expect(mentions(addedConcerns, condition)).toBe(true);
      expect(mentions(addedRecommendations, condition)).toBe(false);
    }
    for (const condition of medium) {
      expect(mentions(addedRecommendations, condition)).toBe(true);
      expect(mentions(addedConcerns, condition)).toBe(false);
    }
  });

  it('프로필에 없는 품종이면 아무것도 덧붙이지 않는다', () => {
    const merged = service.mergeIntoReport(
      emptyContent(),
      params({ breed: '알 수 없는 품종', birthDate: SENIOR_BIRTH }),
    );

    expect(merged).toEqual(emptyContent());
  });
});

/**
 * 이 병합은 LLM이 아니라 규칙 기반 비즈니스 로직이므로, 어떤 생성기를 쓰든 같은 문구가
 * 붙어야 한다. 생성기마다 복제돼 있으면 한쪽만 고쳐져 갈라진다 — 실제로 그랬다.
 */
describe('두 생성기가 같은 품종 규칙을 탄다', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(TODAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mock과 LLM이 덧붙이는 품종 문구가 동일하다', async () => {
    const breedProfile = new BreedProfileService();
    const p = params({ breed: '말티즈', birthDate: SENIOR_BIRTH });

    const mock = new MockHealthReportGenerator(breedProfile);
    const llm = new LlmHealthReportGenerator(
      {
        generateReport: () =>
          Promise.resolve({ summary: 'AI', trends: [], concerns: [], actions: [] }),
      } as unknown as ChatGptHealthReportClient,
      {
        healthRecord: { findMany: () => Promise.resolve([]) },
        medication: { findMany: () => Promise.resolve([]) },
        medicalEvent: { findFirst: () => Promise.resolve(null) },
      } as unknown as PrismaService,
      breedProfile,
    );

    const mockResult = mock.generate(p);
    // mock 생성기는 2~3초 대기가 들어 있다.
    await jest.advanceTimersByTimeAsync(4000);

    const [fromMock, fromLlm] = await Promise.all([mockResult, llm.generate(p)]);

    // 각 생성기의 고유 본문을 걷어내고 품종 규칙이 덧붙인 부분만 비교한다.
    const breedLines = (c: ReportContent) => ({
      senior: c.highlights.filter((h) => h.includes('노령기')),
      high: c.concerns.filter((x) => x.includes('위험이 있어요')),
      medium: c.recommendations.filter((x) => x.includes('발병률이 상대적으로 높아요')),
    });

    const fromMockLines = breedLines(fromMock);
    expect(fromMockLines.senior.length).toBeGreaterThan(0);
    expect(fromMockLines.high.length).toBeGreaterThan(0);
    expect(fromMockLines.medium.length).toBeGreaterThan(0);
    expect(breedLines(fromLlm)).toEqual(fromMockLines);
  });
});
