import { create } from 'zustand';

const STORAGE_KEY = 'ah:font';

export type Font = {
  family: string;
  href?: string;
  displayName?: string;
};

export const SYSTEM_FONT: Font = {
  family: "'Inter', system-ui, sans-serif",
  displayName: 'System (Inter)',
};

export const FONT_PRESETS: Font[] = [
  SYSTEM_FONT,
  {
    family: "'Bebas Neue', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    displayName: 'Bebas Neue',
  },
  {
    family: "'Playfair Display', serif",
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap',
    displayName: 'Playfair',
  },
  {
    family: "'JetBrains Mono', monospace",
    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;800&display=swap',
    displayName: 'JetBrains Mono',
  },
  {
    family: "'Caveat', cursive",
    href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap',
    displayName: 'Caveat',
  },
  {
    family: "'Space Grotesk', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap',
    displayName: 'Space Grotesk',
  },
  {
    family: "'Anton', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
    displayName: 'Anton',
  },
  {
    family: "'Pacifico', cursive",
    href: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    displayName: 'Pacifico',
  },
];

// Only stylesheet hosts we trust ourselves to load opaquely. Tampered
// localStorage (or a future feature that takes user-supplied URLs)
// can't sneak in an arbitrary <link rel="stylesheet"> origin.
const ALLOWED_FONT_ORIGINS = new Set(['https://fonts.googleapis.com']);

const isSafeFontHref = (href: string): boolean => {
  try {
    const url = new URL(href);
    return ALLOWED_FONT_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
};

const loadInitial = (): Font => {
  if (typeof window === 'undefined') return SYSTEM_FONT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SYSTEM_FONT;
    const parsed = JSON.parse(raw) as Font;
    if (!parsed?.family) return SYSTEM_FONT;
    // Reject persisted fonts whose href has been tampered to a non-
    // allow-listed origin. Falling back to the system font is harmless.
    if (parsed.href && !isSafeFontHref(parsed.href)) return SYSTEM_FONT;
    return parsed;
  } catch {
    return SYSTEM_FONT;
  }
};

const ensureLink = (href: string) => {
  if (typeof document === 'undefined') return;
  if (!isSafeFontHref(href)) return;
  const id = `ah-font-${btoa(href).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

type State = {
  font: Font;
  setFont: (f: Font) => void;
};

export const useFontStore = create<State>((set) => {
  const initial = loadInitial();
  if (initial.href) ensureLink(initial.href);
  return {
    font: initial,
    setFont: (f) => {
      if (f.href) ensureLink(f.href);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
        } catch {
          /* ignore */
        }
      }
      set({ font: f });
    },
  };
});
