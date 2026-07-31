import type { AppetiteLevel, ActivityLevel } from '@petlog/ai';

/**
 * 건강 기록의 저장 값 → ChatGPT 입력 형식 변환.
 *
 * HealthRecord는 유형별 값을 numValue/textValue라는 범용 칸에 담는다. 어떤 유형이
 * 어느 칸에 무엇을 넣는지는 프론트의 buildVariables(useCreateHealthRecord)가 정하고,
 * 스키마상으로는 Float/String일 뿐이라 타입이 지켜주지 않는다. 그래서 실제로 저장되는
 * 값을 기준으로 여기서 한 번 걸러낸다.
 *
 * 인식할 수 없는 값은 버린다. 리포트 입력을 임의의 기본값으로 채우면 근거 없는 서술이
 * 그대로 사용자에게 나가므로, 데이터가 적은 편이 낫다.
 */

/**
 * 식사 기록은 textValue에 화면 표시 문자열이 그대로 저장된다
 * (프론트 APPETITE_LABEL: good→'잘 먹음', normal→'보통', bad→'안 먹음').
 *
 * Map을 쓰는 이유: textValue는 createHealthRecord로 임의 문자열이 들어올 수 있는데,
 * 객체 리터럴로 조회하면 'constructor'나 'toString' 같은 프로토타입 키가 값처럼 잡혀
 * AppetiteLevel이 아닌 함수가 반환된다. Map에는 그런 키가 없다.
 */
const APPETITE_TEXT = new Map<string, AppetiteLevel>([
  ['잘 먹음', 'good'],
  ['보통', 'normal'],
  ['안 먹음', 'poor'],
]);

export function toAppetiteLevel(textValue: string | null): AppetiteLevel | null {
  if (textValue === null) return null;
  return APPETITE_TEXT.get(textValue) ?? null;
}

const ACTIVITY_LEVELS: ActivityLevel[] = ['high', 'normal', 'low'];

/**
 * 산책 기록은 ActivityLevel을 저장하지 않는다 — numValue에 시간(분), textValue에
 * 거리(km)가 들어간다. 따라서 현재 스키마로는 등급을 만들 수 없고, 등급 기준을
 * 정하는 것은 제품 결정이라 여기서 임의로 만들지 않는다.
 *
 * 그때까지는 인식 가능한 값만 통과시킨다. 예전에 등급이 저장된 기록이 있으면 살리고,
 * 없으면 빈 배열이 되어 리포트에서 산책 항목이 빠진다 — 거리 문자열('3.5')을
 * 등급인 척 넘기는 것보다 낫다.
 */
export function toActivityLevel(textValue: string | null): ActivityLevel | null {
  if (textValue === null) return null;
  return ACTIVITY_LEVELS.includes(textValue as ActivityLevel) ? (textValue as ActivityLevel) : null;
}
