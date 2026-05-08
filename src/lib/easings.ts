import type { Easing } from '@/types/animation';

export const EASING_PRESETS: { name: string; value: Easing }[] = [
  { name: 'linear', value: { kind: 'preset', value: 'linear' } },
  { name: 'ease', value: { kind: 'preset', value: 'ease' } },
  { name: 'ease-in', value: { kind: 'preset', value: 'ease-in' } },
  { name: 'ease-out', value: { kind: 'preset', value: 'ease-out' } },
  { name: 'ease-in-out', value: { kind: 'preset', value: 'ease-in-out' } },
  {
    name: 'spring',
    value: { kind: 'cubic', v: [0.5, 1.5, 0.5, 1] },
  },
  {
    name: 'bounce',
    value: { kind: 'cubic', v: [0.68, -0.6, 0.32, 1.6] },
  },
  {
    name: 'elastic',
    value: { kind: 'cubic', v: [0.7, -0.4, 0.4, 1.4] },
  },
  {
    name: 'sharp',
    value: { kind: 'cubic', v: [0.2, 0.8, 0.2, 1] },
  },
  {
    name: 'gentle',
    value: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
  },
];

export function easingToCss(e: Easing): string {
  if (e.kind === 'preset') return e.value;
  if (e.kind === 'steps') {
    const n = Math.max(1, Math.round(e.n));
    return `steps(${n}, jump-${e.jump})`;
  }
  const [a, b, c, d] = e.v;
  return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
}
