/**
 * 테마 설정의 단일 출처.
 *
 * 두 축으로 나뉜다.
 * - Theme(팔레트): 파스텔 스카이 / 로즈 핑크
 * - ThemeMode(명암): 시스템 설정 따름 / 라이트 / 다크
 *
 * 이 파일은 ThemeProvider(런타임)와 layout.tsx의 첫 페인트 전 인라인 스크립트가
 * 함께 참조한다. 키 이름이 갈리면 새로고침할 때마다 테마가 튀므로 여기서만 정의한다.
 */
export type Theme = 'pastel-sky' | 'pastel-pink';
export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'petlog-theme';
export const THEME_MODE_STORAGE_KEY = 'petlog-theme-mode';

export const DEFAULT_THEME: Theme = 'pastel-sky';
export const DEFAULT_THEME_MODE: ThemeMode = 'system';

export const THEMES: { value: Theme; label: string; preview: string }[] = [
  // preview 는 설정 화면의 미리보기 원. 각 팔레트의 대표색(--color-primary)과 같은 값이라
  // 실제 적용 결과와 어긋나지 않아야 한다.
  { value: 'pastel-sky', label: '파스텔 스카이', preview: '#2f7099' },
  { value: 'pastel-pink', label: '로즈 핑크', preview: '#b34760' },
];

export const THEME_MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export function isTheme(value: unknown): value is Theme {
  return value === 'pastel-sky' || value === 'pastel-pink';
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** 'system' 을 실제 명암(light|dark)으로 해석한다. DOM 의 data-mode 에는 이 결과만 들어간다. */
export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
