import { useEffect, useState } from 'react';

export type AccentName = 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber';

export const ACCENTS: { name: AccentName; rgb: string; soft: string; hex: string }[] = [
  { name: 'violet', rgb: '124 92 255', soft: '60 40 140', hex: '#7c5cff' },
  { name: 'cyan', rgb: '6 182 212', soft: '14 80 96', hex: '#06b6d4' },
  { name: 'emerald', rgb: '16 185 129', soft: '6 78 59', hex: '#10b981' },
  { name: 'rose', rgb: '244 63 94', soft: '136 19 55', hex: '#f43f5e' },
  { name: 'amber', rgb: '245 158 11', soft: '146 64 14', hex: '#f59e0b' },
];

const STORAGE_KEY = 'ah:accent';

export function useAccent() {
  const [accent, setAccentState] = useState<AccentName>(() => {
    if (typeof window === 'undefined') return 'violet';
    const stored = window.localStorage.getItem(STORAGE_KEY) as AccentName | null;
    return ACCENTS.some((a) => a.name === stored) ? (stored as AccentName) : 'violet';
  });

  useEffect(() => {
    const def = ACCENTS.find((a) => a.name === accent) ?? ACCENTS[0];
    document.documentElement.style.setProperty('--accent', def.rgb);
    document.documentElement.style.setProperty('--accent-soft', def.soft);
    try {
      window.localStorage.setItem(STORAGE_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  return { accent, setAccent: setAccentState };
}
