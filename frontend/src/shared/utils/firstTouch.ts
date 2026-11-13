// 가입 경로(first-touch) — 이 브라우저가 처음 들어온 공개 페이지와 유입처.
//
// 방문 로그(visit_events)는 방문자를 식별하지 않아 "어느 채널이 가입으로 이어졌나"를
// 답하지 못한다. 처음 방문 때 한 번 저장해 두고 가입 요청에 실어 보낸다.
// 며칠 뒤 다시 와서 가입하는 경우가 흔하므로 sessionStorage가 아니라 localStorage에 둔다.

export interface FirstTouch {
  landingPath: string;
  referrer?: string;
  utmSource?: string;
}

const KEY = 'petlog-first-touch';

/** 이미 저장돼 있으면 덮어쓰지 않는다(first-touch). */
export function rememberFirstTouch(touch: FirstTouch): void {
  try {
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    // 계측 실패가 화면에 영향을 주면 안 된다.
  }
}

export function readFirstTouch(): FirstTouch | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : undefined;
  } catch {
    return undefined;
  }
}
