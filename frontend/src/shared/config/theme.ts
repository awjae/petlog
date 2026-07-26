// 테마 정의와 저장 키. ThemeProvider(React 상태)와 THEME_INIT_SCRIPT(하이드레이션 전
// DOM 적용)가 같은 값을 써야 하므로 한곳에 둔다.

export const THEMES = ['pastel-sky', 'pastel-pink'] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'pastel-sky';

export const THEME_STORAGE_KEY = 'petlog-theme';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

// <body>의 첫 자식으로 동기 실행되는 스크립트. 인라인 sync script는 파싱을 막으므로
// 이 시점엔 본문이 아직 파싱되지 않았고, 따라서 첫 페인트부터 올바른 테마가 적용된다.
//
// 이게 없으면 pastel-pink 사용자는 매 진입마다 ThemeProvider의 useEffect가 실행될
// 때까지 기본 테마(pastel-sky)의 색과 html 배경(#c8bfaa)을 한 프레임 보게 된다.
//
// localStorage 접근은 시크릿 모드/스토리지 차단 환경에서 throw할 수 있어 try로 감싼다.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});document.documentElement.dataset.theme=${JSON.stringify(
  THEMES,
)}.indexOf(t)>-1?t:${JSON.stringify(DEFAULT_THEME)}}catch(e){document.documentElement.dataset.theme=${JSON.stringify(
  DEFAULT_THEME,
)}}})()`;
