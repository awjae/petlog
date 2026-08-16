// 서비스 기준 시간대는 Asia/Seoul이다.
// 결정 문서: .claude/docs/decisions/033-service-timezone.md
//   — 단일 타임존을 택한 이유, 같은 가정을 공유하는 곳들, 다국가 전환 경로 3가지.
// 사용 가이드: .claude/docs/timezone.md
//   — 순간 vs 벽시계 구분, 클라이언트 규칙, 테스트 픽스처 작성법.
//
// 컨테이너 TZ는 UTC다(어디에도 TZ를 지정하지 않았고, ECS Fargate 기본값이 UTC다).
// 그래서 `new Date()` 후 `setHours(0,0,0,0)`으로 "오늘 0시"를 구하면 UTC 자정이
// 잡혀, KST 00시~09시 사이에는 하루 전 구간을 조회한다. 그 시간대에 만들어진
// 기록은 "오늘"에서 빠지고, 대신 어제 기록이 오늘로 집계됐다.
//
// 프로세스 TZ에 의존하지 않고 고정 오프셋으로 계산한다. KST는 서머타임이 없어
// 오프셋이 항상 +09:00이고, 이렇게 두면 로컬·CI·배포 환경의 TZ가 달라도 결과가 같다.
//
// 반대로 `setHours`로 계산하면 프로세스 TZ를 따라간다. 그게 원래 버그였고, 개발 머신이
// Asia/Seoul이라 로컬에서는 통과하고 UTC 컨테이너에서만 틀렸다. 그래서 테스트는
// TZ=UTC로 고정해 돌린다 (jest.config.ts).
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 주어진 시각이 속한 **KST 달력 하루**의 시작·끝을 UTC 인스턴트로 반환한다.
 *
 * `start <= x < end` 형태로 쓴다. end는 다음 날 00:00이므로 `lt`로 비교해야 한다.
 */
export function kstDayRange(now: Date = new Date()): { start: Date; end: Date } {
  // KST 벽시계로 옮겨 날짜만 남긴 뒤, 다시 UTC 인스턴트로 되돌린다.
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const kstMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  const start = new Date(kstMidnight - KST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/**
 * 주어진 시각이 속한 **KST 달력 한 달**의 시작과 다음 달 시작을 UTC 인스턴트로 반환한다.
 *
 * `start <= x < nextStart` 형태로 쓴다(반열림). 월마다 길이가 달라 `start + 30일` 같은
 * 산술로는 만들 수 없으므로, 달력 필드에서 직접 다음 달 1일을 만든다.
 *
 * `Date.UTC`는 month에 12를 넘기면 다음 해 1월로 넘겨주므로 12월 경계도 그대로 처리된다.
 */
export function kstMonthRange(now: Date = new Date()): { start: Date; nextStart: Date } {
  // kstDayRange와 같은 방식 — KST 벽시계로 옮겨 연/월만 읽고, 다시 UTC로 되돌린다.
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS),
    nextStart: new Date(Date.UTC(year, month + 1, 1) - KST_OFFSET_MS),
  };
}
