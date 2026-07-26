'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from '@/shared/config/theme';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: DEFAULT_THEME, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // localStorage를 다시 읽지 않는다. 실제 적용된 테마는 layout.tsx의
  // THEME_INIT_SCRIPT가 이미 <html data-theme>에 확정해 뒀으므로, 여기서는
  // 그 값을 React 상태로 가져오기만 한다(설정 화면의 선택 표시용).
  useEffect(() => {
    const applied = document.documentElement.dataset.theme;
    if (isTheme(applied)) {
      setThemeState(applied);
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
    document.documentElement.dataset.theme = t;
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
