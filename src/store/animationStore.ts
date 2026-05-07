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

export type AnimationState = {
  config: AnimationConfig;
  selectedKeyframeId: string;
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
  setPathDraw: (enabled: boolean) => void;
  // keyframes
  selectKeyframe: (id: string) => void;
  addKeyframe: (at?: number) => void;
  removeKeyframe: (id: string) => void;
  updateKeyframe: (id: string, patch: Partial<Keyframe>) => void;
  updateKeyframeTransform: (id: string, patch: Partial<Transform>) => void;
  resetAll: () => void;
};

export const useAnimationStore = create<AnimationState>((set) => ({
  config: initialConfig,
  selectedKeyframeId: initialConfig.keyframes[0].id,

  setTarget: (target) =>
    set((s) => {
      if (target !== 'svg') {
        return { config: { ...s.config, target } };
      }
      // Seed path-draw keyframes the first time the user switches to SVG.
      // We replace the keyframes with a clean draw pair (strokeDashoffset
      // 100 → 0) and identity transforms, because the shape default's
      // translate of 120px is interpreted in SVG user-space and pushes the
      // path far off the viewBox. Once the user has edited a strokeDashoffset
      // anywhere, we leave their keyframes alone.
      const hasDashoffset = s.config.keyframes.some(
        (k) => typeof k.strokeDashoffset === 'number',
      );
      if (hasDashoffset) {
        return { config: { ...s.config, target } };
      }
      const draw: Keyframe[] = [
        {
          id: uid(),
          at: 0,
          transform: { ...blankTransform },
          opacity: 1,
          strokeDashoffset: 100,
        },
        {
          id: uid(),
          at: 100,
          transform: { ...blankTransform },
          opacity: 1,
          strokeDashoffset: 0,
        },
      ];
      return {
        config: { ...s.config, target, keyframes: draw },
        selectedKeyframeId: draw[0].id,
      };
    }),
  setShape: (shape) =>
    set((s) => ({ config: { ...s.config, shape } })),
  setText: (text) =>
    set((s) => ({ config: { ...s.config, text } })),
  setSvgPath: (id) =>
    set((s) => ({ config: { ...s.config, svgPath: id } })),
  setDuration: (duration) =>
    set((s) => ({ config: { ...s.config, duration } })),
  setDelay: (delay) =>
    set((s) => ({ config: { ...s.config, delay } })),
  setIterations: (iterations) =>
    set((s) => ({ config: { ...s.config, iterations } })),
  setDirection: (direction) =>
    set((s) => ({ config: { ...s.config, direction } })),
  setFill: (fill) =>
    set((s) => ({ config: { ...s.config, fill } })),
  setEasing: (easing) =>
    set((s) => ({ config: { ...s.config, easing } })),
  setStagger: (step) =>
    set((s) => ({
      config: {
        ...s.config,
        stagger: step === null ? undefined : { step },
      },
    })),

  setPathDraw: (enabled) =>
    set((s) => {
      if (!enabled) {
        // Strip strokeDashoffset from every keyframe; preserve all other props.
        const stripped = s.config.keyframes.map((k) => {
          if (typeof k.strokeDashoffset !== 'number') return k;
          const { strokeDashoffset: _drop, ...rest } = k;
          return rest as Keyframe;
        });
        return { config: { ...s.config, keyframes: stripped } };
      }
      // Enable: 100 on the first keyframe (sorted by `at`), 0 on the last,
      // intermediates left alone so CSS interpolates between the endpoints.
      const sorted = [...s.config.keyframes].sort((a, b) => a.at - b.at);
      const firstId = sorted[0]?.id;
      const lastId = sorted[sorted.length - 1]?.id;
      const next = s.config.keyframes.map((k) => {
        if (k.id === firstId) return { ...k, strokeDashoffset: 100 };
        if (k.id === lastId) return { ...k, strokeDashoffset: 0 };
        return k;
      });
      return { config: { ...s.config, keyframes: next } };
    }),

  selectKeyframe: (id) => set({ selectedKeyframeId: id }),

  addKeyframe: (at) =>
    set((s) => {
      const sorted = [...s.config.keyframes].sort((a, b) => a.at - b.at);
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
      return {
        config: { ...s.config, keyframes: [...s.config.keyframes, next] },
        selectedKeyframeId: next.id,
      };
    }),

  removeKeyframe: (id) =>
    set((s) => {
      if (s.config.keyframes.length <= 2) return s;
      const remaining = s.config.keyframes.filter((k) => k.id !== id);
      return {
        config: { ...s.config, keyframes: remaining },
        selectedKeyframeId:
          s.selectedKeyframeId === id ? remaining[0].id : s.selectedKeyframeId,
      };
    }),

  updateKeyframe: (id, patch) =>
    set((s) => ({
      config: {
        ...s.config,
        keyframes: s.config.keyframes.map((k) =>
          k.id === id ? { ...k, ...patch } : k
        ),
      },
    })),

  updateKeyframeTransform: (id, patch) =>
    set((s) => ({
      config: {
        ...s.config,
        keyframes: s.config.keyframes.map((k) =>
          k.id === id
            ? {
                ...k,
                transform: { ...blankTransform, ...k.transform, ...patch },
              }
            : k
        ),
      },
    })),

  resetAll: () =>
    set({
      config: {
        ...initialConfig,
        keyframes: [startKeyframe(), endKeyframe()],
      },
    }),
}));
