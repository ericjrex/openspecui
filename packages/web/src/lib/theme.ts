export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'openspecui-theme';

export function resolveTheme(storedTheme: string | null): Theme {
  return storedTheme === 'light' ? 'light' : 'dark';
}

export function isDarkTheme(theme: Theme): boolean {
  return theme === 'dark';
}
