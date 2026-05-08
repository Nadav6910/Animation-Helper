import { describe, it, expect } from 'vitest';
import { TEXT_EFFECTS, applyTextEffect } from '@/lib/textEffects';
import { generateCss } from '@/lib/generateCss';
import type { AnimationConfig } from '@/types/animation';

const base: AnimationConfig = {
  target: 'text',
  selector: '.t',
  text: 'Animate',
  shape: 'square',
  svgPath: 'check',
  keyframes: [
    { id: 'a', at: 0 },
    { id: 'b', at: 100 },
  ],
  duration: 1000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
};

describe('text effects', () => {
  it('every effect produces a config that round-trips through generateCss', () => {
    for (const e of TEXT_EFFECTS) {
      const next = e.apply(base);
      expect(next.target).toBe('text');
      expect(next.keyframes.length).toBeGreaterThanOrEqual(2);
      expect(() => generateCss(next)).not.toThrow();
    }
  });

  it('every effect emits stagger', () => {
    for (const e of TEXT_EFFECTS) {
      const next = e.apply(base);
      expect(next.stagger?.step).toBeGreaterThan(0);
    }
  });

  it('applyTextEffect returns null for unknown id', () => {
    expect(applyTextEffect('nope' as never, base)).toBeNull();
  });
});
