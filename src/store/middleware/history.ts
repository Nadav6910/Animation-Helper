import type { AnimationConfig } from '@/types/animation';

export type HistoryEntry = AnimationConfig;

export type HistoryState = {
  past: HistoryEntry[];
  future: HistoryEntry[];
  present: HistoryEntry | null;
};

export type HistoryRecorder = {
  record: (next: AnimationConfig) => void;
  undo: () => AnimationConfig | null;
  redo: () => AnimationConfig | null;
  reset: (initial: AnimationConfig) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  isDirty: () => boolean;
  markPristine: () => void;
};

export type HistoryRecorderOptions = {
  debounceMs?: number;
  limit?: number;
  now?: () => number;
};

const cloneConfig = (c: AnimationConfig): AnimationConfig =>
  JSON.parse(JSON.stringify(c)) as AnimationConfig;

const sameConfig = (a: AnimationConfig, b: AnimationConfig): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export function createHistoryRecorder(
  initial: AnimationConfig,
  opts: HistoryRecorderOptions = {}
): HistoryRecorder {
  const debounceMs = opts.debounceMs ?? 300;
  const limit = opts.limit ?? 100;
  const now = opts.now ?? (() => Date.now());

  const state: HistoryState = {
    past: [],
    future: [],
    present: cloneConfig(initial),
  };
  let pristine: AnimationConfig = cloneConfig(initial);
  let lastRecordAt = Number.NEGATIVE_INFINITY;

  const pushPast = (entry: AnimationConfig) => {
    state.past.push(entry);
    if (state.past.length > limit) state.past.shift();
  };

  return {
    record(next) {
      if (!state.present) {
        state.present = cloneConfig(next);
        return;
      }
      if (sameConfig(state.present, next)) return;

      const t = now();
      const withinDebounce = t - lastRecordAt < debounceMs;
      lastRecordAt = t;

      if (!withinDebounce) {
        pushPast(state.present);
        state.future = [];
      }
      state.present = cloneConfig(next);
    },
    undo() {
      if (state.past.length === 0) return null;
      const prev = state.past.pop()!;
      if (state.present) state.future.push(state.present);
      state.present = prev;
      lastRecordAt = Number.NEGATIVE_INFINITY;
      return cloneConfig(prev);
    },
    redo() {
      if (state.future.length === 0) return null;
      const next = state.future.pop()!;
      if (state.present) pushPast(state.present);
      state.present = next;
      lastRecordAt = Number.NEGATIVE_INFINITY;
      return cloneConfig(next);
    },
    reset(value) {
      state.past = [];
      state.future = [];
      state.present = cloneConfig(value);
      pristine = cloneConfig(value);
      lastRecordAt = Number.NEGATIVE_INFINITY;
    },
    canUndo() {
      return state.past.length > 0;
    },
    canRedo() {
      return state.future.length > 0;
    },
    isDirty() {
      return !!state.present && !sameConfig(state.present, pristine);
    },
    markPristine() {
      if (state.present) pristine = cloneConfig(state.present);
    },
  };
}
