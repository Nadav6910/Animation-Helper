import type { AnimationConfig } from '@/types/animation';

export type TextEffectId = 'typewriter' | 'wave' | 'glitch' | 'rise';

const uid = () => Math.random().toString(36).slice(2, 9);
const blank = {
  translate: [0, 0] as [number, number],
  rotate: [0, 0] as [number, number],
  skew: [0, 0] as [number, number],
  scale: [1, 1] as [number, number],
};

export type TextEffect = {
  id: TextEffectId;
  name: string;
  description: string;
  apply: (current: AnimationConfig) => AnimationConfig;
};

export const TEXT_EFFECTS: TextEffect[] = [
  {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Each letter snaps in left-to-right',
    apply: (c) => ({
      ...c,
      target: 'text',
      iterations: 1,
      direction: 'normal',
      fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank, scale: [0.6, 0.6] } },
        { id: uid(), at: 50, opacity: 1, transform: { ...blank, scale: [1, 1] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank } },
      ],
      duration: 600,
      easing: { kind: 'steps', n: 1, jump: 'end' },
      stagger: { step: 80 },
    }),
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Letters bob up and down in sequence',
    apply: (c) => ({
      ...c,
      target: 'text',
      iterations: 'infinite',
      direction: 'normal',
      fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank } },
        { id: uid(), at: 50, transform: { ...blank, translate: [0, -14] } },
        { id: uid(), at: 100, transform: { ...blank } },
      ],
      duration: 1400,
      easing: { kind: 'preset', value: 'ease-in-out' },
      stagger: { step: 90 },
    }),
  },
  {
    id: 'glitch',
    name: 'Glitch',
    description: 'Letters jitter with random offsets',
    apply: (c) => ({
      ...c,
      target: 'text',
      iterations: 'infinite',
      direction: 'normal',
      fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank } },
        { id: uid(), at: 20, transform: { ...blank, translate: [-2, 1], skew: [-2, 0] } },
        { id: uid(), at: 40, transform: { ...blank, translate: [3, -1], skew: [2, 0] } },
        { id: uid(), at: 60, transform: { ...blank, translate: [-1, 2], skew: [-1, 0] } },
        { id: uid(), at: 80, transform: { ...blank, translate: [2, 0] } },
        { id: uid(), at: 100, transform: { ...blank } },
      ],
      duration: 700,
      easing: { kind: 'steps', n: 6, jump: 'end' },
      stagger: { step: 30 },
    }),
  },
  {
    id: 'rise',
    name: 'Rise · blur',
    description: 'Letters fade and lift while un-blurring',
    apply: (c) => ({
      ...c,
      target: 'text',
      iterations: 1,
      direction: 'normal',
      fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, blur: 14, transform: { ...blank, translate: [0, 30] } },
        { id: uid(), at: 100, opacity: 1, blur: 0, transform: { ...blank } },
      ],
      duration: 900,
      easing: { kind: 'cubic', v: [0.16, 1, 0.3, 1] },
      stagger: { step: 65 },
    }),
  },
];

export function applyTextEffect(
  effectId: TextEffectId,
  current: AnimationConfig
): AnimationConfig | null {
  const e = TEXT_EFFECTS.find((x) => x.id === effectId);
  return e ? e.apply(current) : null;
}
