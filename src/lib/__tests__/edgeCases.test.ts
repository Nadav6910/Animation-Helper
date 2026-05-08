import { describe, it, expect } from 'vitest';
import { generateCss } from '@/lib/generateCss';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateFramerMotion } from '@/lib/generateFramerMotion';
import { generateScss } from '@/lib/generateScss';
import { generateWaapi } from '@/lib/generateWaapi';
import { generateHtml } from '@/lib/generateHtml';
import type { AnimationConfig } from '@/types/animation';

const baseCfg = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  text: 'Animate',
  svgPath: 'check',
  keyframes: [
    { id: 'a', at: 0, opacity: 0 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
  ...overrides,
});

describe('generators — degenerate inputs do not throw or emit invalid CSS', () => {
  it('NaN/Infinity duration collapses to 0ms in CSS', () => {
    expect(generateCss(baseCfg({ duration: NaN }))).toContain('0ms');
    expect(generateCss(baseCfg({ duration: Infinity }))).toContain('0ms');
  });

  it('negative duration collapses to 0ms', () => {
    expect(generateCss(baseCfg({ duration: -500 }))).toContain('0ms');
  });

  it('single keyframe doesn’t crash any generator', () => {
    const cfg = baseCfg({ keyframes: [{ id: 's', at: 0, opacity: 0.5 }] });
    expect(() => generateCss(cfg)).not.toThrow();
    expect(() => generateTailwind(cfg)).not.toThrow();
    expect(() => generateFramerMotion(cfg)).not.toThrow();
    expect(() => generateScss(cfg)).not.toThrow();
    expect(() => generateWaapi(cfg)).not.toThrow();
    expect(() => generateHtml(cfg)).not.toThrow();
  });

  it('empty keyframes still produces a parseable @keyframes block', () => {
    const out = generateCss(baseCfg({ keyframes: [] }));
    // A bare @keyframes name {} block is valid CSS; the rule just has
    // no per-percent stops.
    expect(out).toContain('@keyframes play {');
    expect(out).toContain('animation: play');
  });
});

describe('steps easing — every jump direction is wired', () => {
  it.each(['start', 'end', 'none', 'both'] as const)(
    'serializes jump-%s into the rule shorthand',
    (jump) => {
      const cfg = baseCfg({ easing: { kind: 'steps', n: 4, jump } });
      expect(generateCss(cfg)).toContain(`steps(4, jump-${jump})`);
    }
  );
});

describe('rotate3d round-trips through real generateCss', () => {
  it('emits rotate3d() inside the keyframe transform when set on a keyframe', () => {
    const out = generateCss(
      baseCfg({
        keyframes: [
          { id: 'a', at: 0, transform: { rotate3d: { x: 1, y: 0, z: 0, deg: 0 } } },
          { id: 'b', at: 100, transform: { rotate3d: { x: 1, y: 0, z: 0, deg: 90 } } },
        ],
      })
    );
    expect(out).toContain('transform: rotate3d(1, 0, 0, 90deg);');
    // Zero-degree rotate3d at the first keyframe is a no-op so the
    // generator skips it entirely (no rotateX/Y fallback because there's
    // no `rotate` set either).
    expect(out).not.toContain('rotate3d(1, 0, 0, 0deg)');
  });

  it('switches to rotateX/Y when rotate3d has a degenerate axis', () => {
    const out = generateCss(
      baseCfg({
        keyframes: [
          {
            id: 'a',
            at: 0,
            transform: {
              rotate: [10, 0],
              rotate3d: { x: 0, y: 0, z: 0, deg: 45 },
            },
          },
          { id: 'b', at: 100, transform: {} },
        ],
      })
    );
    expect(out).toContain('rotateX(10deg)');
    expect(out).not.toContain('rotate3d');
  });
});
