import { describe, expect, it } from 'vitest';
import {
  tokenize,
  tokenizeModeOf,
  tokenAnimationFor,
  hasTokenAnimations,
} from '@/lib/tokenize';
import { validateAnimationConfig } from '@/lib/validateConfig';
import type { AnimationConfig } from '@/types/animation';

const base: AnimationConfig = {
  target: 'text',
  selector: '.animated',
  text: 'Hello World',
  keyframes: [
    { id: 'a', at: 0, opacity: 0 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1000,
  delay: 0,
  iterations: 1,
  direction: 'normal',
  fill: 'forwards',
  easing: { kind: 'preset', value: 'linear' },
};

describe('tokenize — letter mode', () => {
  it('splits into one token per code point, spaces included', () => {
    expect(tokenize('A B', 'letter')).toEqual(['A', ' ', 'B']);
  });

  it('keeps surrogate pairs (emoji) intact as one token', () => {
    // 👋 is a surrogate pair — .split('') would break it; spread
    // operator (used internally) keeps it whole.
    expect(tokenize('a👋b', 'letter')).toEqual(['a', '👋', 'b']);
  });

  it('returns [] for empty text', () => {
    expect(tokenize('', 'letter')).toEqual([]);
  });

  it('returns a fresh array each call', () => {
    const a = tokenize('hi', 'letter');
    a.push('x');
    expect(tokenize('hi', 'letter')).toEqual(['h', 'i']);
  });
});

describe('tokenize — word mode', () => {
  it('keeps whitespace runs as their own tokens', () => {
    expect(tokenize('Hello World', 'word')).toEqual([
      'Hello',
      ' ',
      'World',
    ]);
  });

  it('collapses each whitespace run into a single token', () => {
    expect(tokenize('a   b', 'word')).toEqual(['a', '   ', 'b']);
  });

  it('handles leading and trailing whitespace without empty tokens', () => {
    expect(tokenize('  hi  ', 'word')).toEqual(['  ', 'hi', '  ']);
  });

  it('treats tabs / newlines as whitespace tokens', () => {
    expect(tokenize('a\tb\nc', 'word')).toEqual([
      'a',
      '\t',
      'b',
      '\n',
      'c',
    ]);
  });

  it('single word → single token', () => {
    expect(tokenize('Solo', 'word')).toEqual(['Solo']);
  });

  it('returns [] for empty text', () => {
    expect(tokenize('', 'word')).toEqual([]);
  });
});

describe('tokenizeModeOf', () => {
  it("defaults to 'letter' when tokenizeMode is absent", () => {
    expect(tokenizeModeOf(base)).toBe('letter');
  });

  it("returns 'word' when set", () => {
    expect(tokenizeModeOf({ ...base, tokenizeMode: 'word' })).toBe('word');
  });

  it("falls back to 'letter' for an unexpected value", () => {
    expect(
      tokenizeModeOf({
        ...base,
        tokenizeMode: 'sentence' as unknown as 'letter',
      })
    ).toBe('letter');
  });
});

describe('tokenAnimationFor / hasTokenAnimations', () => {
  it('returns null when there are no tokenAnimations', () => {
    expect(tokenAnimationFor(0, base)).toBeNull();
    expect(hasTokenAnimations(base)).toBe(false);
  });

  it('returns the presetId for a covered token', () => {
    const cfg: AnimationConfig = {
      ...base,
      tokenAnimations: [
        { tokens: [0, 2], presetId: 'text-rise-reveal' },
        { tokens: [4], presetId: 'text-wave' },
      ],
    };
    expect(tokenAnimationFor(0, cfg)).toBe('text-rise-reveal');
    expect(tokenAnimationFor(2, cfg)).toBe('text-rise-reveal');
    expect(tokenAnimationFor(4, cfg)).toBe('text-wave');
    expect(tokenAnimationFor(1, cfg)).toBeNull();
    expect(hasTokenAnimations(cfg)).toBe(true);
  });

  it('first matching entry wins on overlap', () => {
    const cfg: AnimationConfig = {
      ...base,
      tokenAnimations: [
        { tokens: [1], presetId: 'first' },
        { tokens: [1], presetId: 'second' },
      ],
    };
    expect(tokenAnimationFor(1, cfg)).toBe('first');
  });
});

describe('validateAnimationConfig — tokenize fields', () => {
  it("accepts tokenizeMode 'word'", () => {
    const parsed = validateAnimationConfig({ ...base, tokenizeMode: 'word' });
    expect(parsed?.tokenizeMode).toBe('word');
  });

  it('drops an invalid tokenizeMode', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenizeMode: 'paragraph',
    });
    expect(parsed?.tokenizeMode).toBeUndefined();
  });

  it('preserves a well-formed tokenAnimations array', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: [0, 1, 2], presetId: 'text-wave' }],
    });
    expect(parsed?.tokenAnimations).toEqual([
      { tokens: [0, 1, 2], presetId: 'text-wave' },
    ]);
  });

  it('floors token indices to non-negative integers', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: [-3, 1.7, 2], presetId: 'p' }],
    });
    // -3 → 0, 1.7 → 1, 2 → 2
    expect(parsed?.tokenAnimations).toEqual([
      { tokens: [0, 1, 2], presetId: 'p' },
    ]);
  });

  it('drops entries with a missing / non-string presetId', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [
        { tokens: [0], presetId: 123 },
        { tokens: [1], presetId: 'ok' },
      ],
    });
    expect(parsed?.tokenAnimations).toEqual([
      { tokens: [1], presetId: 'ok' },
    ]);
  });

  it('drops entries with no valid token indices', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: ['a', null], presetId: 'p' }],
    });
    expect(parsed?.tokenAnimations).toBeUndefined();
  });

  it('caps the number of entries and indices to prevent blob bloat', () => {
    const tooManyEntries = Array.from({ length: 100 }, () => ({
      tokens: [0],
      presetId: 'p',
    }));
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: tooManyEntries,
    });
    expect(parsed?.tokenAnimations?.length).toBe(64);

    const tooManyTokens = Array.from({ length: 1000 }, (_, i) => i);
    const parsed2 = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: tooManyTokens, presetId: 'p' }],
    });
    expect(parsed2?.tokenAnimations?.[0].tokens.length).toBe(512);
  });

  it('drops a presetId longer than the cap', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: [0], presetId: 'x'.repeat(65) }],
    });
    expect(parsed?.tokenAnimations).toBeUndefined();
  });
});
