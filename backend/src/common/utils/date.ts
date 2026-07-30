// 서비스 기준 시간대는 Asia/Seoul이다.
//
// 컨테이너 TZ는 UTC다(어디에도 TZ를 지정하지 않았고, ECS Fargate 기본값이 UTC다).
// 그래서 `new Date()` 후 `setHours(0,0,0,0)`으로 "오늘 0시"를 구하면 UTC 자정이
// 잡혀, KST 00시~09시 사이에는 하루 전 구간을 조회한다. 그 시간대에 만들어진
// 기록은 "오늘"에서 빠지고, 대신 어제 기록이 오늘로 집계됐다.
//
// 프로세스 TZ에 의존하지 않고 고정 오프셋으로 계산한다. KST는 서머타임이 없어
// 오프셋이 항상 +09:00이고, 이렇게 두면 로컬·CI·배포 환경의 TZ가 달라도 결과가
// 같다(테스트도 TZ 고정 없이 통과한다).
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
