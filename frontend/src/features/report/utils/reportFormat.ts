export function formatPeriodRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  const sm = s.getMonth() + 1;
  const em = e.getMonth() + 1;
  const sd = s.getDate();
  const ed = e.getDate();
  if (sy === ey && sm === em) {
    return `${sy}년 ${sm}월 ${sd}일 ~ ${ed}일`;
  }
  return `${sy}.${String(sm).padStart(2, '0')}.${String(sd).padStart(2, '0')} ~ ${String(em).padStart(2, '0')}.${String(ed).padStart(2, '0')}`;
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export interface FailureNotice {
  heading: string;
  desc: string;
}

// failedReason은 서버 예외 메시지 원문을 담을 수 있어 그대로 노출하지 않고 카테고리화한다.
export function categorizeFailureReason(reason: string | null | undefined): FailureNotice {
  const normalized = reason?.toLowerCase() ?? '';
  const isTimeout =
    normalized.includes('시간') ||
    normalized.includes('timed out') ||
    normalized.includes('timeout');

  if (isTimeout) {
    return {
      heading: '리포트 생성이 오래 걸렸어요',
      desc: '처리 시간이 초과됐어요. 다시 시도해주세요',
    };
  }

  return {
    heading: '리포트 생성에 실패했어요',
    desc: '일시적인 오류가 발생했어요. 다시 시도해주세요',
  };
}
