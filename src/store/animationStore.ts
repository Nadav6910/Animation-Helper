import { create } from 'zustand';
import type {
  AnimationConfig,
  Direction,
  Easing,
  FillMode,
  Keyframe,
  ShapeKind,
  TargetKind,
  Transform,
} from '@/types/animation';
import { createHistoryRecorder } from './middleware/history';

const uid = () => Math.random().toString(36).slice(2, 9);

const blankTransform: Transform = {
  translate: [0, 0],
  rotate: [0, 0],
  skew: [0, 0],
  scale: [1, 1],
};

const startKeyframe = (): Keyframe => ({
  id: uid(),
  at: 0,
  transform: { ...blankTransform },
  opacity: 1,
});

const endKeyframe = (): Keyframe => ({
  id: uid(),
  at: 100,
  transform: {
    translate: [120, 0],
    rotate: [0, 0],
    skew: [0, 0],
    scale: [1, 1],
  },
  opacity: 1,
});

const initialConfig: AnimationConfig = {
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  text: 'Animate',
  svgPath: 'check',
  keyframes: [startKeyframe(), endKeyframe()],
  duration: 1500,
  delay: 0,
  iterations: 'infinite',
  direction: 'alternate',
  fill: 'none',
  easing: { kind: 'cubic', v: [0.2, 0.8, 0.2, 1] },
};

const history = createHistoryRecorder(initialConfig, { debounceMs: 350 });

export type AnimationState = {
  config: AnimationConfig;
  selectedKeyframeId: string;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  // setters
  setTarget: (t: TargetKind) => void;
  setShape: (s: ShapeKind) => void;
  setText: (t: string) => void;
  setSvgPath: (id: string) => void;
  setDuration: (ms: number) => void;
  setDelay: (ms: number) => void;
  setIterations: (i: number | 'infinite') => void;
  setDirection: (d: Direction) => void;
  setFill: (f: FillMode) => void;
  setEasing: (e: Easing) => void;
  setStagger: (step: number | null) => void;
  // keyframes
  selectKeyframe: (id: string) => void;
  addKeyframe: (at?: number) => void;
  removeKeyframe: (id: string) => void;
  updateKeyframe: (id: string, patch: Partial<Keyframe>) => void;
  updateKeyframeTransform: (id: string, patch: Partial<Transform>) => void;
  resetAll: () => void;
  // bulk replace (presets, undo/redo)
  applyConfig: (next: AnimationConfig, opts?: { record?: boolean }) => void;
  // history
  undo: () => void;
  redo: () => void;
  markPristine: () => void;
};

const refreshHistoryFlags = () => ({
  canUndo: history.canUndo(),
  canRedo: history.canRedo(),
  isDirty: history.isDirty(),
});

export const useAnimationStore = create<AnimationState>((set, get) => {
  const commit = (next: AnimationConfig) => {
    history.record(next);
    set({ config: next, ...refreshHistoryFlags() });
  };
  const update = (mutator: (c: AnimationConfig) => AnimationConfig) => {
    const next = mutator(get().config);
    commit(next);
  };

  return {
    config: initialConfig,
    selectedKeyframeId: initialConfig.keyframes[0].id,
    canUndo: false,
    canRedo: false,
    isDirty: false,

    setTarget: (target) => update((c) => ({ ...c, target })),
    setShape: (shape) => update((c) => ({ ...c, shape })),
    setText: (text) => update((c) => ({ ...c, text })),
    setSvgPath: (id) => update((c) => ({ ...c, svgPath: id })),
    setDuration: (duration) => update((c) => ({ ...c, duration })),
    setDelay: (delay) => update((c) => ({ ...c, delay })),
    setIterations: (iterations) => update((c) => ({ ...c, iterations })),
    setDirection: (direction) => update((c) => ({ ...c, direction })),
    setFill: (fill) => update((c) => ({ ...c, fill })),
    setEasing: (easing) => update((c) => ({ ...c, easing })),
    setStagger: (step) =>
      update((c) => ({
        ...c,
        stagger: step === null ? undefined : { step },
      })),

    selectKeyframe: (id) => set({ selectedKeyframeId: id }),

    addKeyframe: (at) => {
      const c = get().config;
      const sorted = [...c.keyframes].sort((a, b) => a.at - b.at);
      let position = at;
      if (position == null) {
        const gaps = sorted.map((k, i) =>
          i === 0 ? 0 : (sorted[i - 1].at + k.at) / 2
        );
        position = gaps.length > 1 ? gaps[1] : 50;
      }
      const next: Keyframe = {
        id: uid(),
        at: Math.max(0, Math.min(100, position)),
        transform: { ...blankTransform },
        opacity: 1,
      };
      const updated = { ...c, keyframes: [...c.keyframes, next] };
      history.record(updated);
      set({
        config: updated,
        selectedKeyframeId: next.id,
        ...refreshHistoryFlags(),
      });
    },

    removeKeyframe: (id) => {
      const s = get();
      if (s.config.keyframes.length <= 2) return;
      const remaining = s.config.keyframes.filter((k) => k.id !== id);
      const updated = { ...s.config, keyframes: remaining };
      history.record(updated);
      set({
        config: updated,
        selectedKeyframeId:
          s.selectedKeyframeId === id ? remaining[0].id : s.selectedKeyframeId,
        ...refreshHistoryFlags(),
      });
    },

    updateKeyframe: (id, patch) =>
      update((c) => ({
        ...c,
        keyframes: c.keyframes.map((k) => (k.id === id ? { ...k, ...patch } : k)),
      })),

    updateKeyframeTransform: (id, patch) =>
      update((c) => ({
        ...c,
        keyframes: c.keyframes.map((k) =>
          k.id === id
            ? {
                ...k,
                transform: { ...blankTransform, ...k.transform, ...patch },
              }
            : k
        ),
      })),

    resetAll: () => {
      const fresh: AnimationConfig = {
        ...initialConfig,
        keyframes: [startKeyframe(), endKeyframe()],
      };
      history.reset(fresh);
      set({
        config: fresh,
        selectedKeyframeId: fresh.keyframes[0].id,
        ...refreshHistoryFlags(),
      });
    },

    applyConfig: (next, opts) => {
      const cloned: AnimationConfig = JSON.parse(JSON.stringify(next));
      if (opts?.record === false) {
        history.reset(cloned);
      } else {
        history.record(cloned);
      }
      set({
        config: cloned,
        selectedKeyframeId: cloned.keyframes[0]?.id ?? get().selectedKeyframeId,
        ...refreshHistoryFlags(),
      });
    },

    undo: () => {
      const prev = history.undo();
      if (!prev) return;
      set({
        config: prev,
        selectedKeyframeId: prev.keyframes[0]?.id ?? get().selectedKeyframeId,
        ...refreshHistoryFlags(),
      });
    },

    redo: () => {
      const next = history.redo();
      if (!next) return;
      set({
        config: next,
        selectedKeyframeId: next.keyframes[0]?.id ?? get().selectedKeyframeId,
        ...refreshHistoryFlags(),
      });
    },

    markPristine: () => {
      history.markPristine();
      set(refreshHistoryFlags());
    },
  };
});
