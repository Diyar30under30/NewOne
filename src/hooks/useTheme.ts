import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import type { Theme } from '../types';

export function useTheme() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-contrast', 'dark');

    if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('theme-contrast');
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'contrast'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  return { theme, setTheme, cycleTheme };
}
