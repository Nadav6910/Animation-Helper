import { describe, it, expect } from 'vitest';
import {
  generateCss,
  transformToCss,
  filterToCss,
  resolveTokenPresets,
  PER_TOKEN_PRESET_CAP,
} from '../generateCss';
import { PRESETS } from '@/lib/presets';
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
    expect(out).toBe('translate3d(10px, 20px, 0px) rotateY(45deg) scale(1.2, 1.2)');
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

describe('generateCss — 3D & perspective', () => {
  it('emits translate3d Z axis', () => {
    const out = transformToCss({
      translate: [10, 20],
      translateZ: 30,
    });
    expect(out).toBe('translate3d(10px, 20px, 30px)');
  });

  it('emits perspective() before transforms', () => {
    const out = transformToCss({
      translate: [0, 0],
      perspective: 600,
    });
    expect(out?.startsWith('perspective(600px)')).toBe(true);
  });

  it('emits rotate3d when supplied', () => {
    const out = transformToCss({
      rotate3d: { x: 1, y: 1, z: 0, deg: 45 },
    });
    expect(out).toBe('rotate3d(1, 1, 0, 45deg)');
  });

  it('prefers rotate3d over rotateX/Y when both are set', () => {
    const out = transformToCss({
      rotate: [30, 45],
      rotate3d: { x: 1, y: 0, z: 0, deg: 90 },
    });
    expect(out).toContain('rotate3d(1, 0, 0, 90deg)');
    expect(out).not.toContain('rotateX');
    expect(out).not.toContain('rotateY');
  });

  it('skips a rotate3d with zero angle (no-op)', () => {
    const out = transformToCss({
      rotate: [10, 0],
      rotate3d: { x: 1, y: 1, z: 0, deg: 0 },
    });
    expect(out).toContain('rotateX(10deg)');
    expect(out).not.toContain('rotate3d');
  });

  it('skips a rotate3d with degenerate (all-zero) axis', () => {
    const out = transformToCss({
      rotate: [10, 0],
      rotate3d: { x: 0, y: 0, z: 0, deg: 45 },
    });
    expect(out).toContain('rotateX(10deg)');
    expect(out).not.toContain('rotate3d');
  });

  it('emits Z-only translate when only translateZ is set', () => {
    const out = transformToCss({ translateZ: 50 });
    expect(out).toBe('translate3d(0px, 0px, 50px)');
  });
});

describe('generateCss — per-keyframe easing & steps', () => {
  it('emits animation-timing-function for keyframes with easing', () => {
    const css = generateCss(
      makeConfig({
        keyframes: [
          { id: 'a', at: 0, opacity: 0 },
          {
            id: 'b',
            at: 100,
            opacity: 1,
            easing: { kind: 'preset', value: 'ease-out' },
          },
        ],
      })
    );
    expect(css).toContain('animation-timing-function: ease-out;');
  });

  it('serializes steps() easing', () => {
    const css = generateCss(
      makeConfig({ easing: { kind: 'steps', n: 6, jump: 'end' } })
    );
    expect(css).toContain('steps(6, jump-end)');
  });
});

describe('generateCss — offset-path motion', () => {
  it('emits offset-path on the rule and offset-distance per keyframe', () => {
    const css = generateCss(
      makeConfig({
        offsetPath: { d: 'M0,0 L100,0', rotate: 'auto' },
        keyframes: [
          { id: 'a', at: 0, offsetDistance: 0 },
          { id: 'b', at: 100, offsetDistance: 100 },
        ],
      })
    );
    expect(css).toContain("offset-path: path('M0,0 L100,0');");
    expect(css).toContain('offset-rotate: auto;');
    expect(css).toContain('offset-distance: 0%;');
    expect(css).toContain('offset-distance: 100%;');
  });
});

describe('generateCss — gradient backgrounds', () => {
  it('emits background: for gradient strings', () => {
    const css = generateCss(
      makeConfig({
        keyframes: [
          { id: 'a', at: 0, bg: 'linear-gradient(45deg, #ff0080, #7928ca)' },
          { id: 'b', at: 100, bg: '#7c5cff' },
        ],
      })
    );
    expect(css).toContain('background: linear-gradient(45deg, #ff0080, #7928ca);');
    expect(css).toContain('background-color: #7c5cff;');
  });
});

describe('generateCss — gradient fill / text color', () => {
  it('applies the background-clip: text trick on text targets', () => {
    const css = generateCss(
      makeConfig({
        target: 'text',
        keyframes: [
          {
            id: 'a',
            at: 0,
            color: 'linear-gradient(90deg, #ff8a00 0%, #e52e71 100%)',
          },
          { id: 'b', at: 100, color: '#7c5cff' },
        ],
      })
    );
    expect(css).toContain(
      'background: linear-gradient(90deg, #ff8a00 0%, #e52e71 100%);'
    );
    expect(css).toContain('background-clip: text;');
    expect(css).toContain('-webkit-background-clip: text;');
    expect(css).toContain('color: transparent;');
    expect(css).toContain('color: #7c5cff;');
  });

  it('falls back to the first colour stop on non-text targets', () => {
    const css = generateCss(
      makeConfig({
        target: 'shape',
        keyframes: [
          {
            id: 'a',
            at: 0,
            color: 'linear-gradient(90deg, #ff8a00 0%, #e52e71 100%)',
          },
          { id: 'b', at: 100, color: '#7c5cff' },
        ],
      })
    );
    expect(css).not.toContain('background-clip: text;');
    expect(css).toContain('color: #ff8a00;');
    expect(css).toContain('color: #7c5cff;');
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
          transform: translate3d(0px, 0px, 0px) scale(1, 1);
          opacity: 0;
          filter: blur(8px);
        }
        50% {
          transform: translate3d(40px, 0px, 0px) scale(1.1, 1.1);
          opacity: 1;
        }
        100% {
          transform: translate3d(80px, 0px, 0px) scale(1, 1);
          opacity: 1;
        }
      }"
    `);
  });
});

describe('generateCss — cssVars output', () => {
  it('emits timing slots as CSS variables and references them via animation-* longhands', () => {
    const css = generateCss(makeConfig(), { cssVars: true });
    // Variable declarations land before the animation longhands.
    expect(css).toContain('--ah-duration: 2s;');
    expect(css).toContain('--ah-easing: cubic-bezier(0.2, 0.8, 0.2, 1);');
    expect(css).toContain('--ah-delay: 100ms;');
    expect(css).toContain('--ah-iterations: 2;');
    // Each timing slot has its own one-slot longhand referencing its
    // var. Using the `animation:` shorthand with positional `var()`
    // refs is off-spec — browsers can't bind by type at parse time
    // and the result is brittle. Longhands are unambiguous.
    expect(css).toContain('animation-name: play;');
    expect(css).toContain('animation-duration: var(--ah-duration);');
    expect(css).toContain('animation-timing-function: var(--ah-easing);');
    expect(css).toContain('animation-delay: var(--ah-delay);');
    expect(css).toContain('animation-iteration-count: var(--ah-iterations);');
    // Direction / fill stay literal (categorical, rarely tuned).
    expect(css).toContain('animation-direction: alternate;');
    expect(css).toContain('animation-fill-mode: forwards;');
    // No `animation:` shorthand line at all in cssVars mode.
    expect(css).not.toMatch(/^\s*animation:\s/m);
    // Keyframes body unchanged from the literal mode.
    expect(css).toContain('transform: translate3d(80px, 0px, 0px)');
  });

  it('omits direction / fill longhands when at defaults under cssVars', () => {
    const css = generateCss(
      makeConfig({ direction: 'normal', fill: 'none' }),
      { cssVars: true }
    );
    expect(css).not.toContain('animation-direction:');
    expect(css).not.toContain('animation-fill-mode:');
    // Timing longhands still emitted.
    expect(css).toContain('animation-name: play;');
    expect(css).toContain('animation-duration: var(--ah-duration);');
  });

  it('every preset round-trips through cssVars-on output without throwing', () => {
    // Sanity check: the cssVars option is keyframes-agnostic, so any
    // valid preset config should produce a parseable CSS rule.
    const cfg = makeConfig({ iterations: 'infinite', direction: 'normal' });
    expect(() => generateCss(cfg, { cssVars: true })).not.toThrow();
    expect(generateCss(cfg, { cssVars: true })).toContain(
      '--ah-iterations: infinite;'
    );
  });

  it('stagger > span rule emits longhands referencing the inherited vars', () => {
    const css = generateCss(
      makeConfig({
        target: 'text',
        text: 'Hi',
        stagger: { step: 50 },
        direction: 'normal',
        fill: 'none',
      }),
      { cssVars: true }
    );
    // The span rule must repeat animation longhands (animation
    // properties don't inherit) but the `--ah-*` CSS vars cascade
    // from the parent rule. Per-letter delay overrides the parent's
    // `var(--ah-delay)` with the calc(var(--i) * step) offset.
    expect(css).toMatch(/> span\s*\{[^}]*animation-name: play;/);
    expect(css).toMatch(
      /> span\s*\{[^}]*animation-duration: var\(--ah-duration\);/
    );
    expect(css).toMatch(
      /> span\s*\{[^}]*animation-delay: calc\(var\(--i\) \* 50ms\);/
    );
  });
});

describe('generateCss — per-token animations', () => {
  const textCfg = (overrides: Partial<AnimationConfig> = {}) =>
    makeConfig({
      target: 'text',
      selector: '.t',
      text: 'Hi there',
      ...overrides,
    });

  it('emits a base > span rule + a data-anim override rule + its @keyframes', () => {
    const css = generateCss(
      textCfg({ tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }] })
    );
    // base span rule so non-overridden tokens still animate
    expect(css).toContain('.t > span {');
    // override rule, keyed by the raw presetId
    expect(css).toContain('.t > span[data-anim="text-wave"] {');
    expect(css).toMatch(
      /> span\[data-anim="text-wave"\]\s*\{[^}]*animation: play-tok-1 /
    );
    // a dedicated @keyframes built from the preset's own keyframes
    expect(css).toContain('@keyframes play-tok-1 {');
    expect(css).toContain('@keyframes play {');
  });

  it('dedupes a presetId used by multiple entries into one rule + one @keyframes', () => {
    const css = generateCss(
      textCfg({
        tokenAnimations: [
          { tokens: [0], presetId: 'text-wave' },
          { tokens: [3], presetId: 'text-wave' },
        ],
      })
    );
    const kf = css.match(/@keyframes play-tok-1 \{/g) ?? [];
    const rule = css.match(/\[data-anim="text-wave"\]/g) ?? [];
    expect(kf.length).toBe(1);
    expect(rule.length).toBe(1);
    expect(css).not.toContain('play-tok-2');
  });

  it('an unknown presetId emits no override rule / @keyframes but keeps the base span rule', () => {
    const css = generateCss(
      textCfg({ tokenAnimations: [{ tokens: [0], presetId: 'no-such' }] })
    );
    expect(css).toContain('.t > span {'); // hasTokenAnimations → spans
    expect(css).not.toContain('data-anim="no-such"');
    expect(css).not.toContain('play-tok-1');
  });

  it('without stagger the spans carry no per-letter delay', () => {
    const css = generateCss(
      textCfg({ tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }] })
    );
    expect(css).not.toContain('animation-delay: calc(var(--i)');
  });

  it('with stagger the override rule also gets the staggered delay', () => {
    const css = generateCss(
      textCfg({
        stagger: { step: 40 },
        tokenAnimations: [{ tokens: [1], presetId: 'text-wave' }],
      })
    );
    expect(css).toMatch(
      /> span\[data-anim="text-wave"\]\s*\{[^}]*animation-delay: calc\(var\(--i\) \* 40ms\);/
    );
  });

  it('non-text targets never emit per-token output', () => {
    const css = generateCss(
      makeConfig({
        target: 'shape',
        tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }],
      })
    );
    expect(css).not.toContain('> span');
    expect(css).not.toContain('play-tok-1');
  });

  it('resolveTokenPresets caps distinct presets and skips unknown ids', () => {
    const ids = PRESETS.slice(0, PER_TOKEN_PRESET_CAP + 5).map((p) => p.id);
    const cfg = textCfg({
      tokenAnimations: [
        ...ids.map((presetId, i) => ({ tokens: [i], presetId })),
        { tokens: [999], presetId: 'definitely-not-real' },
      ],
    });
    const resolved = resolveTokenPresets(cfg);
    expect(resolved.length).toBe(PER_TOKEN_PRESET_CAP);
    expect(resolved.every((r) => r.presetId !== 'definitely-not-real')).toBe(
      true
    );
    // kfName is counter-derived & safe regardless of the presetId charset
    expect(resolved[0].kfName).toBe('play-tok-1');
  });

  it('resolveTokenPresets returns [] for non-text / no overrides', () => {
    expect(resolveTokenPresets(makeConfig({ target: 'shape' }))).toEqual([]);
    expect(resolveTokenPresets(textCfg())).toEqual([]);
  });

  it('a fully-shadowed duplicate entry emits no dead @keyframes / rule', () => {
    // token 0 resolves to text-wave (first match wins); the second
    // entry only lists 0, so text-pop-in owns no token and must NOT
    // produce a rule the markup can never select.
    const css = generateCss(
      textCfg({
        tokenAnimations: [
          { tokens: [0], presetId: 'text-wave' },
          { tokens: [0], presetId: 'text-pop-in' },
        ],
      })
    );
    expect(css).toContain('[data-anim="text-wave"]');
    expect(css).not.toContain('text-pop-in');
    expect(css).not.toContain('play-tok-2');
  });

  it('per-token override uses literal preset timing even under cssVars', () => {
    const css = generateCss(
      textCfg({
        stagger: { step: 30 },
        tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }],
      }),
      { cssVars: true }
    );
    // base span rule references the cascaded global vars …
    expect(css).toMatch(/> span\s*\{[^}]*animation-duration: var\(--ah-duration\);/);
    // … but the override rule resets to a literal `animation:` shorthand
    // with the PRESET's own timing (not var(--ah-*)), so it can't pick
    // up the global duration/easing.
    expect(css).toMatch(
      /> span\[data-anim="text-wave"\]\s*\{\s*animation: play-tok-1 /
    );
    expect(css).not.toMatch(
      /\[data-anim="text-wave"\]\s*\{[^}]*var\(--ah-duration\)/
    );
    // staggered delay still applied to the override
    expect(css).toMatch(
      /\[data-anim="text-wave"\]\s*\{[^}]*animation-delay: calc\(var\(--i\) \* 30ms\);/
    );
  });
});
