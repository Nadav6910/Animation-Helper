import { create } from 'zustand';

const SLOW_KEY = 'ah:slowmo';

const loadSlow = (): number => {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(SLOW_KEY);
  const n = raw ? Number(raw) : 1;
  return [1, 0.5, 0.25].includes(n) ? n : 1;
};

type State = {
  slowMo: number;
  setSlowMo: (n: number) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
};

export const useUiStore = create<State>((set) => ({
  slowMo: loadSlow(),
  setSlowMo: (n) => {
    set({ slowMo: n });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SLOW_KEY, String(n));
      } catch {
        /* ignore */
      }
    }
  },
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  shortcutsOpen: false,
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
}));
