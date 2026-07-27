// 리포트 기간/생성일 표기는 실행 환경의 타임존을 따르지 않고 한국 시간으로 고정한다.
//
// 이 함수들은 이제 브라우저와 서버(generateMetadata, OG 이미지) 양쪽에서 호출된다.
// ECS 태스크에는 TZ가 설정돼 있지 않아 서버는 UTC로 동작하는데, 기간 경계는 작성자의
// 로컬 자정 기준으로 만들어진다(reportPeriod.ts의 toStartOfDayIso). 그래서 로컬
// 타임존을 쓰면 같은 리포트가 화면에서는 "6월 1일 ~ 30일", 링크 미리보기에서는
// "05.31 ~ 06.30"으로 갈린다 — 날짜뿐 아니라 같은 달 분기를 못 타 형식까지 달라진다.
//
// 한국 사용자 대상 서비스이고 기간도 한국 시간 기준으로 선택되므로, 보는 사람이
// 어디에 있든 작성자가 고른 그 날짜를 보여주는 게 맞다.
const DISPLAY_TIME_ZONE = 'Asia/Seoul';

// en-CA 로케일은 YYYY-MM-DD로 포맷한다.
const datePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dateParts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = datePartsFormatter.format(new Date(iso)).split('-').map(Number);
  return { year, month, day };
}

export function formatPeriodRange(start: string, end: string): string {
  const s = dateParts(start);
  const e = dateParts(end);

  if (s.year === e.year && s.month === e.month) {
    return `${s.year}년 ${s.month}월 ${s.day}일 ~ ${e.day}일`;
  }
  return `${s.year}.${String(s.month).padStart(2, '0')}.${String(s.day).padStart(2, '0')} ~ ${String(e.month).padStart(2, '0')}.${String(e.day).padStart(2, '0')}`;
}

export function formatCreatedAt(iso: string): string {
  const d = dateParts(iso);
  return `${d.year}.${String(d.month).padStart(2, '0')}.${String(d.day).padStart(2, '0')}`;
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
