import { create } from 'zustand';

// Slow-mo is intentionally NOT persisted. It's a debugging/preview tool,
// not a long-term setting — having it stick across reloads led to users
// thinking the default duration "felt slower" because a stray ½× from a
// previous session followed them back. Reset to full speed on every
// load; a single click brings ½× back when needed.

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
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
  toast: ToastEntry | null;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
  /** Class name that `useAnimationStyle` puts on the live preview
   *  element. Published by PreviewStage so the visual exporter can find
   *  the same element + its WAAPI Animation without a React ref tunnel. */
  previewTargetClassName: string | null;
  setPreviewTargetClassName: (cn: string | null) => void;
};

let toastCounter = 0;
let toastTimer: number | null = null;

export const useUiStore = create<State>((set) => ({
  slowMo: 1,
  setSlowMo: (n) => set({ slowMo: n }),
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  shortcutsOpen: false,
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  exportOpen: false,
  setExportOpen: (v) => set({ exportOpen: v }),
  previewTargetClassName: null,
  setPreviewTargetClassName: (cn) => set({ previewTargetClassName: cn }),
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

