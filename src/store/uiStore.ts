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
  /** True while the OnboardingTour is mounted + visible. App.tsx's
   *  global hotkey handlers consult this so the tour's own arrow-key
   *  navigation isn't shadowed by the timeline scrub nudges. */
  tourOpen: boolean;
  setTourOpen: (v: boolean) => void;
  /** ID of the active tour step (or null when no tour is running).
   *  Layout surfaces that hide their content (e.g. MobileSheet's
   *  "Code" / "Controls" tabs) read this to auto-reveal whatever
   *  the current step's `data-tour-anchor` lives inside, so the
   *  spotlight always lands on a visible element instead of an
   *  empty box at (0, 0). */
  tourStepId: string | null;
  setTourStepId: (id: string | null) => void;
  toast: ToastEntry | null;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
  /** Class name that `useAnimationStyle` puts on the live preview
   *  element. Published by PreviewStage so the visual exporter can find
   *  the same element + its WAAPI Animation without a React ref tunnel. */
  previewTargetClassName: string | null;
  setPreviewTargetClassName: (cn: string | null) => void;
  /** True when the preview stage is visually occluded — currently flipped
   *  by MobileSheet when its snap reaches 'full' (the sheet covers the
   *  stage entirely). PreviewStage reads this and pauses the running
   *  WAAPI animation so we don't keep ticking compositor work behind an
   *  invisible overlay. Defaults false on desktop (sheet never mounts). */
  stageOccluded: boolean;
  setStageOccluded: (v: boolean) => void;
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
  tourOpen: false,
  setTourOpen: (v) => set({ tourOpen: v }),
  tourStepId: null,
  setTourStepId: (id) => set({ tourStepId: id }),
  previewTargetClassName: null,
  setPreviewTargetClassName: (cn) => set({ previewTargetClassName: cn }),
  stageOccluded: false,
  setStageOccluded: (v) => set({ stageOccluded: v }),
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

