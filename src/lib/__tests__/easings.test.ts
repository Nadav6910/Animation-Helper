import { describe, expect, it } from 'vitest';
import {
  CUBIC_QUICK_STARTERS,
  EASING_VALUE_TOLERANCE,
  easingToCss,
  easingToCubicPreview,
  parseEasing,
} from '@/lib/easings';
import type { Easing } from '@/types/animation';

describe('parseEasing', () => {
  describe('presets', () => {
    it.each(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'])(
      'accepts %s',
      (name) => {
        expect(parseEasing(name)).toEqual({ kind: 'preset', value: name });
      }
    );

    it('is case-insensitive', () => {
      expect(parseEasing('EASE-OUT')).toEqual({
        kind: 'preset',
        value: 'ease-out',
      });
    });

    it('trims surrounding whitespace', () => {
      expect(parseEasing('  linear  ')).toEqual({
        kind: 'preset',
        value: 'linear',
      });
    });

    it('rejects unknown preset names', () => {
      expect(parseEasing('ease-out-back')).toBeNull();
      expect(parseEasing('bouncy')).toBeNull();
    });
  });

  describe('cubic-bezier()', () => {
    it('parses canonical form', () => {
      expect(parseEasing('cubic-bezier(0.4, 0, 0.2, 1)')).toEqual({
        kind: 'cubic',
        v: [0.4, 0, 0.2, 1],
      });
    });

    it('tolerates wide whitespace', () => {
      expect(parseEasing('cubic-bezier(  0.4 ,0,0.2 , 1  )')).toEqual({
        kind: 'cubic',
        v: [0.4, 0, 0.2, 1],
      });
    });

    it('allows negative Y for overshoot / elastic curves', () => {
      expect(parseEasing('cubic-bezier(0.68, -0.6, 0.32, 1.6)')).toEqual({
        kind: 'cubic',
        v: [0.68, -0.6, 0.32, 1.6],
      });
    });

    it('accepts leading-decimal numbers like .5', () => {
      expect(parseEasing('cubic-bezier(.5, .1, .5, 1)')).toEqual({
        kind: 'cubic',
        v: [0.5, 0.1, 0.5, 1],
      });
    });

    it('accepts trailing-decimal numbers like 1.', () => {
      // CSS <number> grammar allows `1.`; some tools emit it that way.
      expect(parseEasing('cubic-bezier(0.5, 1., 0.5, 1.)')).toEqual({
        kind: 'cubic',
        v: [0.5, 1, 0.5, 1],
      });
    });

    it('still rejects double dots and lone dots', () => {
      expect(parseEasing('cubic-bezier(0..5, 0, 0.2, 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(., 0, 0.2, 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(0.4, 0,, 0.2, 1)')).toBeNull();
    });

    it('rejects X1 outside [0, 1]', () => {
      expect(parseEasing('cubic-bezier(-0.1, 0, 0.5, 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(1.1, 0, 0.5, 1)')).toBeNull();
    });

    it('rejects X2 outside [0, 1]', () => {
      expect(parseEasing('cubic-bezier(0.4, 0, -0.01, 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(0.4, 0, 1.5, 1)')).toBeNull();
    });

    it('rejects malformed input', () => {
      expect(parseEasing('cubic-bezier(0.4, 0, 0.2)')).toBeNull();
      expect(parseEasing('cubic-bezier(0.4 0 0.2 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(a, b, c, d)')).toBeNull();
      // Scientific notation and `+` signs aren't valid CSS easing syntax.
      expect(parseEasing('cubic-bezier(1e-1, 0, 0.5, 1)')).toBeNull();
      expect(parseEasing('cubic-bezier(+0.5, 0, 0.5, 1)')).toBeNull();
    });

    it('rejects empty input', () => {
      expect(parseEasing('')).toBeNull();
      expect(parseEasing('   ')).toBeNull();
    });
  });

  describe('raw tuple form', () => {
    it('parses bare four-number tuples', () => {
      expect(parseEasing('0.4, 0, 0.2, 1')).toEqual({
        kind: 'cubic',
        v: [0.4, 0, 0.2, 1],
      });
    });

    it('applies the same X-range validation as cubic-bezier()', () => {
      expect(parseEasing('-0.1, 0, 0.5, 1')).toBeNull();
      expect(parseEasing('0.4, 0, 1.1, 1')).toBeNull();
    });
  });

  describe('steps()', () => {
    it('parses bare step count', () => {
      expect(parseEasing('steps(4)')).toEqual({
        kind: 'steps',
        n: 4,
        jump: 'end',
      });
    });

    it.each(['start', 'end'])('parses bare position %s', (pos) => {
      expect(parseEasing(`steps(4, ${pos})`)).toEqual({
        kind: 'steps',
        n: 4,
        jump: pos,
      });
    });

    it.each(['start', 'end', 'none', 'both'])(
      'parses jump-%s modifier',
      (mod) => {
        expect(parseEasing(`steps(6, jump-${mod})`)).toEqual({
          kind: 'steps',
          n: 6,
          jump: mod,
        });
      }
    );

    it('parses step-start / step-end shorthands', () => {
      expect(parseEasing('step-start')).toEqual({
        kind: 'steps',
        n: 1,
        jump: 'start',
      });
      expect(parseEasing('step-end')).toEqual({
        kind: 'steps',
        n: 1,
        jump: 'end',
      });
    });

    it('rejects zero or negative step counts', () => {
      expect(parseEasing('steps(0)')).toBeNull();
      expect(parseEasing('steps(-1)')).toBeNull();
    });

    it('rejects unknown jump modifiers', () => {
      expect(parseEasing('steps(4, jump-mid)')).toBeNull();
      expect(parseEasing('steps(4, sometime)')).toBeNull();
    });
  });

  describe('garbage rejection', () => {
    it('rejects unknown function names and bare keywords', () => {
      expect(parseEasing('not-a-function(0, 0, 0, 0)')).toBeNull();
      expect(parseEasing('cubic-bezier')).toBeNull();
      expect(parseEasing('cubic-bezier()')).toBeNull();
    });
  });

  describe('easingToCubicPreview', () => {
    // Locks the spec-defined cubic-bezier approximations of the named
    // CSS easings against silent drift. Visual thumbnails depend on
    // these — if they change, every preset thumbnail changes shape.
    it.each([
      ['linear', [0, 0, 1, 1]],
      ['ease', [0.25, 0.1, 0.25, 1]],
      ['ease-in', [0.42, 0, 1, 1]],
      ['ease-out', [0, 0, 0.58, 1]],
      ['ease-in-out', [0.42, 0, 0.58, 1]],
    ] as const)('maps preset %s to its spec cubic-bezier', (name, expected) => {
      const result = easingToCubicPreview({ kind: 'preset', value: name });
      expect(result).toEqual(expected);
    });

    it('passes cubic easings through unchanged', () => {
      const cubic: Easing = { kind: 'cubic', v: [0.68, -0.6, 0.32, 1.6] };
      expect(easingToCubicPreview(cubic)).toEqual([0.68, -0.6, 0.32, 1.6]);
    });

    it('returns null for steps easings (no continuous curve)', () => {
      expect(
        easingToCubicPreview({ kind: 'steps', n: 4, jump: 'end' })
      ).toBeNull();
    });
  });

  describe('CUBIC_QUICK_STARTERS', () => {
    // Lock the curated values against silent drift — a typo or refactor
    // that changed any tuple would visibly change every chip thumbnail
    // and break user muscle memory ("the easeOutBack chip used to look
    // like this"). The values come from https://easings.net and must
    // round-trip exactly.
    it('contains the curated easings.net set with canonical control points', () => {
      expect(CUBIC_QUICK_STARTERS).toEqual([
        { name: 'easeOutQuint', v: [0.22, 1, 0.36, 1] },
        { name: 'easeOutBack', v: [0.34, 1.56, 0.64, 1] },
        { name: 'easeInOutCirc', v: [0.85, 0, 0.15, 1] },
        { name: 'easeOutCirc', v: [0, 0.55, 0.45, 1] },
        { name: 'easeInExpo', v: [0.7, 0, 0.84, 0] },
        { name: 'easeOutExpo', v: [0.16, 1, 0.3, 1] },
      ]);
    });

    it('exposes a stable tolerance constant for active-state matching', () => {
      expect(EASING_VALUE_TOLERANCE).toBe(0.001);
    });
  });

  describe('round-trip with easingToCss', () => {
    // easingToCss(parseEasing(x)) === x for all easing kinds the
    // editor exposes. Catches future drift where one side adds support
    // for a form the other doesn't.
    const fixtures: Easing[] = [
      { kind: 'preset', value: 'linear' },
      { kind: 'preset', value: 'ease-in-out' },
      { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
      { kind: 'cubic', v: [0.68, -0.6, 0.32, 1.6] },
      { kind: 'steps', n: 1, jump: 'end' },
      { kind: 'steps', n: 6, jump: 'none' },
    ];
    it.each(fixtures)('survives parse → toCss round-trip ($kind)', (e) => {
      const parsedBack = parseEasing(easingToCss(e));
      expect(parsedBack).toEqual(e);
    });
  });
});
