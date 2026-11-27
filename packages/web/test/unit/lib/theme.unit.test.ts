import { describe, expect, it } from 'vitest';
import { isDarkTheme, resolveTheme, THEME_STORAGE_KEY } from '@/lib/theme';

describe('theme', () => {
  it('keeps the existing storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('openspecui-theme');
  });

  it('defaults to dark for missing or unknown values', () => {
    expect(resolveTheme(null)).toBe('dark');
    expect(resolveTheme('system')).toBe('dark');
  });

  it('restores a saved light theme', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(isDarkTheme(resolveTheme('light'))).toBe(false);
  });
});
