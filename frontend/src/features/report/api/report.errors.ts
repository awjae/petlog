import { CombinedGraphQLErrors } from '@apollo/client';

const KNOWN_CODES = new Set(['UNPROCESSABLE_ENTITY', 'CONFLICT', 'BAD_REQUEST']);

// UNPROCESSABLE_ENTITY(기록 부족)/CONFLICT(이번 달 리포트 존재)/BAD_REQUEST(기간 오류)는
// report.service.ts가 이미 사용자에게 보여줄 문구로 던진다 — 그대로 노출한다.
// 그 외(네트워크 오류 등)는 내부 오류일 수 있어 일반 문구로 뭉뚱그린다.
export function extractGenerateReportErrorMessage(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const known = error.errors.find((e) => KNOWN_CODES.has(e.extensions?.code as string));
    if (known) return known.message;
  }
  return '리포트 생성에 실패했어요. 다시 시도해주세요.';
}
