import { create } from 'zustand';

const SLOW_KEY = 'ah:slowmo';

const loadSlow = (): number => {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(SLOW_KEY);
    const n = raw ? Number(raw) : 1;
    return [1, 0.5, 0.25].includes(n) ? n : 1;
  } catch {
    return 1;
  }
};

export type ToastTone = 'info' | 'error';

type ToastEntry = {
  id: number;
  message: string;
  tone: ToastTone;
};

type State = {
  slowMo: number;
  setSlowMo: (n: number) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
  toast: ToastEntry | null;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
};

let toastCounter = 0;
let toastTimer: number | null = null;

export const useUiStore = create<State>((set) => ({
  slowMo: loadSlow(),
  setSlowMo: (n) => {
    set({ slowMo: n });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SLOW_KEY, String(n));
      } catch {
        /* ignore quota / privacy-mode write failures */
      }
    }
  },
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  shortcutsOpen: false,
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  toast: null,
  showToast: (message, tone = 'info') => {
    toastCounter += 1;
    const id = toastCounter;
    set({ toast: { id, message, tone } });
    if (typeof window !== 'undefined') {
      if (toastTimer !== null) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        // Only dismiss if the visible toast is still ours — a newer one
        // may have superseded it.
        set((s) => (s.toast?.id === id ? { toast: null } : {}));
        toastTimer = null;
      }, 3500);
    }
  },
  dismissToast: () => set({ toast: null }),
}));
