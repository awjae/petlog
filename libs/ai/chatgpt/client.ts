import OpenAI from 'openai';
import type { HealthReportInput, HealthReportOutput } from './types';

export const PETLOG_MODEL_ID = 'ft:gpt-4o-mini-2024-07-18:personal:petlog:DwkbzhEI';

// 파인튜닝 학습 시 사용한 시스템 프롬프트와 동일하게 유지한다.
const SYSTEM_PROMPT = `당신은 Petlog의 반려동물 건강 리포트 작성 전문가입니다.

규칙:
- 질병 진단이나 의학적 판단을 절대 내리지 않습니다.
- "~일 수 있습니다", "수의사 상담을 권장합니다" 형태로 표현합니다.
- 보호자가 이해하기 쉬운 따뜻하고 명확한 한국어로 작성합니다.
- 긍정적인 부분은 반드시 먼저 언급합니다.

출력 형식(JSON):
{"summary":"한 줄 전체 요약","trends":[{"category":"체중|식욕|활동량","status":"good|normal|caution","description":"변화 설명"}],"concerns":["우려 사항 (없으면 빈 배열)"],"actions":["다음 행동 제안 1~3개"]}`;

const MAX_RETRIES = 3;

export class ChatGptHealthReportClient {
  private readonly openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateReport(input: HealthReportInput): Promise<HealthReportOutput> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: PETLOG_MODEL_ID,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(input) },
          ],
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('ChatGPT로부터 응답이 없습니다.');

        return JSON.parse(content) as HealthReportOutput;
      } catch (err) {
        if (this.isRetryable(err) && attempt < MAX_RETRIES) {
          await this.sleep(1000 * 2 ** (attempt - 1)); // 1s → 2s
          continue;
        }
        throw err;
      }
    }

    throw new Error('최대 재시도 횟수를 초과했습니다.');
  }

  // 429(쿼터 초과), 네트워크 오류, 서버 오류(500)만 재시도한다.
  private isRetryable(err: unknown): boolean {
    return (
      err instanceof OpenAI.RateLimitError ||
      err instanceof OpenAI.APIConnectionError ||
      err instanceof OpenAI.InternalServerError
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
