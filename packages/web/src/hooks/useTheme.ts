import { useCallback, useEffect, useState } from 'react';
import { resolveTheme, THEME_STORAGE_KEY, type Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY)));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
