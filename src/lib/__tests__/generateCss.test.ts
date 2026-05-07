import { describe, it, expect } from 'vitest';
import { generateCss, transformToCss, filterToCss } from '../generateCss';
import type { AnimationConfig, Keyframe } from '@/types/animation';

const makeConfig = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'shape',
  selector: '.shape',
  shape: 'square',
  keyframes: [
    {
      id: 'a',
      at: 0,
      transform: { translate: [0, 0], scale: [1, 1] },
      opacity: 0,
      blur: 8,
    },
    {
      id: 'b',
      at: 100,
      transform: { translate: [80, 0], scale: [1, 1] },
      opacity: 1,
    },
  ],
  duration: 2000,
  delay: 100,
  iterations: 2,
  direction: 'alternate',
  fill: 'forwards',
  easing: { kind: 'cubic', v: [0.2, 0.8, 0.2, 1] },
  ...overrides,
});

describe('generateCss — single transform declaration (bug fix)', () => {
  it('emits exactly one transform declaration per keyframe', () => {
    const css = generateCss(makeConfig());
    const matches0 = css.match(/0% \{[^}]*\}/)?.[0] ?? '';
    const matches100 = css.match(/100% \{[^}]*\}/)?.[0] ?? '';
    expect((matches0.match(/transform:/g) ?? []).length).toBe(1);
    expect((matches100.match(/transform:/g) ?? []).length).toBe(1);
  });

  it('combines multiple transform pieces into one space-separated declaration', () => {
    const out = transformToCss({
      translate: [10, 20],
      rotate: [0, 45],
      scale: [1.2, 1.2],
    });
    expect(out).toBe('translate3d(10px, 20px, 0) rotateY(45deg) scale(1.2, 1.2)');
  });

  it('returns null when transform has no axes', () => {
    expect(transformToCss(undefined)).toBeNull();
  });
});

describe('generateCss — animation shorthand', () => {
  it('serializes duration, easing, delay, iterations, direction, fill', () => {
    const css = generateCss(makeConfig());
    expect(css).toContain(
      'animation: play 2s cubic-bezier(0.2, 0.8, 0.2, 1) 100ms 2 alternate forwards;'
    );
  });

  it('uses `infinite` when iterations is infinite', () => {
    const css = generateCss(makeConfig({ iterations: 'infinite' }));
    expect(css).toMatch(/animation: play 2s [^;]+ infinite/);
  });

  it('omits direction & fill when at defaults', () => {
    const css = generateCss(
      makeConfig({ direction: 'normal', fill: 'none', iterations: 1, delay: 0 })
    );
    expect(css).toContain('animation: play 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0s 1;');
  });

  it('emits duration in ms when sub-second', () => {
    const css = generateCss(makeConfig({ duration: 500, delay: 0, iterations: 1, direction: 'normal', fill: 'none' }));
    expect(css).toContain('animation: play 500ms');
  });
});

describe('generateCss — keyframes & filters', () => {
  it('orders keyframes by `at` ascending', () => {
    const css = generateCss(
      makeConfig({
        keyframes: [
          { id: 'b', at: 100, opacity: 1 },
          { id: 'm', at: 50, opacity: 0.5 },
          { id: 'a', at: 0, opacity: 0 },
        ],
      })
    );
    const i0 = css.indexOf('0% {');
    const i50 = css.indexOf('50% {');
    const i100 = css.indexOf('100% {');
    expect(i0).toBeGreaterThan(0);
    expect(i50).toBeGreaterThan(i0);
    expect(i100).toBeGreaterThan(i50);
  });

  it('combines blur, hue-rotate, drop-shadow into a single filter declaration', () => {
    const f = filterToCss({
      id: 'k',
      at: 0,
      blur: 4,
      hueRotate: 90,
      dropShadow: '0 4px 8px rgba(0,0,0,.5)',
    } as Keyframe);
    expect(f).toBe('blur(4px) hue-rotate(90deg) drop-shadow(0 4px 8px rgba(0,0,0,.5))');
  });

  it('serializes stroke-dashoffset for SVG path-draw', () => {
    const css = generateCss(
      makeConfig({
        target: 'svg',
        selector: '.path',
        keyframes: [
          { id: 'a', at: 0, strokeDashoffset: 100 },
          { id: 'b', at: 100, strokeDashoffset: 0 },
        ],
      })
    );
    expect(css).toContain('stroke-dashoffset: 100;');
    expect(css).toContain('stroke-dashoffset: 0;');
  });

  it('emits stroke-dasharray:100 in the rule body for SVG targets', () => {
    const css = generateCss(
      makeConfig({
        target: 'svg',
        selector: '.path',
        keyframes: [
          { id: 'a', at: 0, strokeDashoffset: 100 },
          { id: 'b', at: 100, strokeDashoffset: 0 },
        ],
      })
    );
    // stroke-dasharray must appear on the selector rule, not inside @keyframes
    const rule = css.split('@keyframes')[0];
    expect(rule).toContain('stroke-dasharray: 100;');
    expect(rule).toContain('pathLength="100"');
  });

  it('omits stroke-dasharray for non-svg targets', () => {
    const css = generateCss(makeConfig({ target: 'shape' }));
    expect(css).not.toContain('stroke-dasharray');
  });

  it('emits stagger rule when stagger is set on text target', () => {
    const css = generateCss(
      makeConfig({ target: 'text', selector: '.txt', stagger: { step: 80 } })
    );
    expect(css).toContain('.txt > span {');
    expect(css).toContain('animation-delay: calc(var(--i) * 80ms)');
  });
});

describe('generateCss — bug regression snapshot', () => {
  it('matches the canonical snapshot for the headline example', () => {
    const css = generateCss(
      makeConfig({
        keyframes: [
          {
            id: '0',
            at: 0,
            transform: { translate: [0, 0], scale: [1, 1] },
            opacity: 0,
            blur: 8,
          },
          {
            id: '50',
            at: 50,
            transform: { translate: [40, 0], scale: [1.1, 1.1] },
            opacity: 1,
            blur: 0,
          },
          {
            id: '100',
            at: 100,
            transform: { translate: [80, 0], scale: [1, 1] },
            opacity: 1,
          },
        ],
      })
    );
    expect(css).toMatchInlineSnapshot(`
      ".shape {
        animation: play 2s cubic-bezier(0.2, 0.8, 0.2, 1) 100ms 2 alternate forwards;
      }

      @keyframes play {
        0% {
          transform: translate3d(0px, 0px, 0) scale(1, 1);
          opacity: 0;
          filter: blur(8px);
        }
        50% {
          transform: translate3d(40px, 0px, 0) scale(1.1, 1.1);
          opacity: 1;
        }
        100% {
          transform: translate3d(80px, 0px, 0) scale(1, 1);
          opacity: 1;
        }
      }"
    `);
  });
});
