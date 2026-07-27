'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_THEME,
  DEFAULT_THEME_MODE,
  THEME_MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isTheme,
  isThemeMode,
  resolveMode,
  type Theme,
  type ThemeMode,
} from '@/shared/config/theme';

/**
 * 테마는 두 축이다 — 팔레트(theme)와 명암(mode).
 *
 * 'system'은 DOM에 그대로 심지 않는다. matchMedia로 해석해 data-mode에는 항상
 * 'light' 또는 'dark'만 들어간다. 덕분에 CSS는 prefers-color-scheme을 몰라도 되고,
 * "사용자가 고른 값이 시스템 설정을 이긴다"는 규칙이 셀렉터 경쟁 없이 성립한다.
 *
 * 첫 페인트 전 적용은 app/layout.tsx의 인라인 스크립트가 맡는다(테마 깜빡임 방지).
 * 여기서는 그 뒤의 상태 관리와 시스템 설정 변경 구독만 담당한다.
 */
const ThemeContext = createContext<{
  theme: Theme;
  mode: ThemeMode;
  setTheme: (t: Theme) => void;
  setMode: (m: ThemeMode) => void;
}>({
  theme: DEFAULT_THEME,
  mode: DEFAULT_THEME_MODE,
  setTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  // 인라인 스크립트가 이미 DOM에 반영해둔 값을 React 상태로 끌어올린다.
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (isTheme(storedTheme)) setThemeState(storedTheme);

      const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (isThemeMode(storedMode)) setModeState(storedMode);
    } catch {
      // 시크릿 모드 등으로 localStorage를 못 읽으면 기본값을 쓴다.
    }
  }, []);

  // 'system'일 때만 OS 설정 변경을 따라간다.
  useEffect(() => {
    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.mode = media.matches ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [mode]);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 저장에 실패해도 이번 세션 동안은 적용된 상태를 유지한다.
    }
  }

  function setMode(next: ThemeMode) {
    setModeState(next);
    document.documentElement.dataset.mode = resolveMode(next);
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
    } catch {
      // 위와 같다.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
