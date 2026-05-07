import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ah:theme';

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'light') root.classList.add('light');
  else root.classList.remove('light');
}

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readInitial());

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggle };
}
