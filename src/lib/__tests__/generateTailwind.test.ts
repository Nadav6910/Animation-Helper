import { describe, it, expect } from 'vitest';
import { generateTailwind } from '../generateTailwind';
import type { AnimationConfig } from '@/types/animation';

const cfg: AnimationConfig = {
  target: 'shape',
  selector: '.shape',
  keyframes: [
    { id: 'a', at: 0, transform: { translate: [0, 0], scale: [1, 1] }, opacity: 0 },
    { id: 'b', at: 100, transform: { translate: [80, 0], scale: [1, 1] }, opacity: 1 },
  ],
  duration: 2000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease-in-out' },
};

describe('generateTailwind', () => {
  it('emits keyframes + animation entries with correct shorthand', () => {
    const out = generateTailwind(cfg, { name: 'play' });
    expect(out).toContain("'0%':");
    expect(out).toContain("'100%':");
    expect(out).toContain("transform: 'translate3d(0px, 0px, 0) scale(1, 1)'");
    expect(out).toContain("'play': 'play 2s ease-in-out 0ms infinite'");
  });

  it('quotes percent keys to keep tailwind config valid JS', () => {
    const out = generateTailwind(cfg);
    expect(out).toMatch(/'0%':/);
    expect(out).toMatch(/'100%':/);
  });

  it('emits a usage hint with the className', () => {
    const out = generateTailwind(cfg, { className: 'animate-play' });
    expect(out).toContain('className="animate-play"');
  });
});
