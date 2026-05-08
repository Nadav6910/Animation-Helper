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
    expect(out).toContain("transform: 'translate3d(0px, 0px, 0px) scale(1, 1)'");
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

  it('emits per-keyframe animation-timing-function', () => {
    const out = generateTailwind({
      ...cfg,
      keyframes: [
        { id: 'a', at: 0, opacity: 0, easing: { kind: 'preset', value: 'ease-in' } },
        { id: 'b', at: 100, opacity: 1 },
      ],
    });
    expect(out).toContain("animationTimingFunction: 'ease-in'");
  });

  it('emits offsetDistance per keyframe', () => {
    const out = generateTailwind({
      ...cfg,
      keyframes: [
        { id: 'a', at: 0, offsetDistance: 0 },
        { id: 'b', at: 100, offsetDistance: 100 },
      ],
    });
    expect(out).toContain("offsetDistance: '0%'");
    expect(out).toContain("offsetDistance: '100%'");
  });

  it('applies the background-clip text trick for gradient color on text', () => {
    const out = generateTailwind({
      ...cfg,
      target: 'text',
      keyframes: [
        { id: 'a', at: 0, color: 'linear-gradient(90deg, #ff0080, #7928ca)' },
        { id: 'b', at: 100, color: '#fff' },
      ],
    });
    expect(out).toContain("background: 'linear-gradient(90deg, #ff0080, #7928ca)'");
    expect(out).toContain("backgroundClip: 'text'");
    expect(out).toContain("WebkitBackgroundClip: 'text'");
    expect(out).toContain("color: 'transparent'");
  });

  it('falls back to first stop for gradient color on non-text targets', () => {
    const out = generateTailwind({
      ...cfg,
      target: 'shape',
      keyframes: [
        { id: 'a', at: 0, color: 'linear-gradient(90deg, #ff0080, #7928ca)' },
      ],
    });
    expect(out).not.toContain("backgroundClip: 'text'");
    expect(out).toContain("color: '#ff0080'");
  });

  it('emits a stagger usage hint for text + stagger', () => {
    const out = generateTailwind({
      ...cfg,
      target: 'text',
      stagger: { step: 80 },
    });
    expect(out).toContain('Per-letter stagger');
    expect(out).toContain('var(--i) * 80ms');
  });
});
