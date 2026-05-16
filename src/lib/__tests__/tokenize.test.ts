import { describe, expect, it } from 'vitest';
import {
  tokenize,
  tokenizeModeOf,
  tokenAnimationFor,
  hasTokenAnimations,
  resolveTokenPreset,
  buildTokenPresetMap,
  assignTokenPreset,
  clearTokenPreset,
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

  it('whitespace-only text → a single whitespace token', () => {
    expect(tokenize('   ', 'word')).toEqual(['   ']);
  });

  it('treats non-breaking space (U+00A0) as a whitespace token', () => {
    // JS \s matches NBSP, so it must NOT be glued onto an adjacent
    // word — the rendered layout depends on this.
    expect(tokenize('a\u00A0b', 'word')).toEqual(['a', '\u00A0', 'b']);
  });

  it('treats thin space (U+2009) as whitespace', () => {
    expect(tokenize('a\u2009b', 'word')).toEqual(['a', '\u2009', 'b']);
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

  it('returns null for an out-of-range index (no entry covers it)', () => {
    const cfg: AnimationConfig = {
      ...base,
      tokenAnimations: [{ tokens: [0, 1], presetId: 'p' }],
    };
    expect(tokenAnimationFor(999, cfg)).toBeNull();
  });
});

describe('resolveTokenPreset', () => {
  it('returns null for an undefined list', () => {
    expect(resolveTokenPreset(0, undefined)).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(resolveTokenPreset(0, [])).toBeNull();
  });

  it('returns the presetId for a covered index, null otherwise', () => {
    const list = [
      { tokens: [0, 2], presetId: 'a' },
      { tokens: [4], presetId: 'b' },
    ];
    expect(resolveTokenPreset(0, list)).toBe('a');
    expect(resolveTokenPreset(2, list)).toBe('a');
    expect(resolveTokenPreset(4, list)).toBe('b');
    expect(resolveTokenPreset(1, list)).toBeNull();
    expect(resolveTokenPreset(99, list)).toBeNull();
  });

  it('first matching entry wins on overlap', () => {
    const list = [
      { tokens: [1], presetId: 'first' },
      { tokens: [1], presetId: 'second' },
    ];
    expect(resolveTokenPreset(1, list)).toBe('first');
  });
});

describe('buildTokenPresetMap', () => {
  it('returns an empty Map for undefined', () => {
    expect(buildTokenPresetMap(undefined).size).toBe(0);
  });

  it('returns an empty Map for an empty list', () => {
    expect(buildTokenPresetMap([]).size).toBe(0);
  });

  it('flattens entries into an index → presetId map', () => {
    const map = buildTokenPresetMap([
      { tokens: [0, 2], presetId: 'a' },
      { tokens: [4], presetId: 'b' },
    ]);
    expect(map.get(0)).toBe('a');
    expect(map.get(2)).toBe('a');
    expect(map.get(4)).toBe('b');
    expect(map.has(1)).toBe(false);
  });

  it('honours first-match-wins (earlier entry not overwritten)', () => {
    const map = buildTokenPresetMap([
      { tokens: [1], presetId: 'first' },
      { tokens: [1], presetId: 'second' },
    ]);
    expect(map.get(1)).toBe('first');
  });
});

describe('assignTokenPreset', () => {
  it('creates a fresh entry from an empty / undefined list', () => {
    expect(assignTokenPreset(undefined, [2, 0, 2], 'p')).toEqual([
      { tokens: [0, 2], presetId: 'p' },
    ]);
    expect(assignTokenPreset([], [1], 'p')).toEqual([
      { tokens: [1], presetId: 'p' },
    ]);
  });

  it('merges into the existing entry for the same presetId', () => {
    expect(
      assignTokenPreset([{ tokens: [0, 1], presetId: 'p' }], [3, 1], 'p')
    ).toEqual([{ tokens: [0, 1, 3], presetId: 'p' }]);
  });

  it('moves a token away from its previous preset (no double-assign)', () => {
    const out = assignTokenPreset(
      [{ tokens: [0, 1, 2], presetId: 'a' }],
      [1],
      'b'
    );
    expect(out).toEqual([
      { tokens: [0, 2], presetId: 'a' },
      { tokens: [1], presetId: 'b' },
    ]);
  });

  it('drops an entry left empty after a reassignment', () => {
    const out = assignTokenPreset([{ tokens: [1], presetId: 'a' }], [1], 'b');
    expect(out).toEqual([{ tokens: [1], presetId: 'b' }]);
  });

  it('ignores negative / non-integer indices', () => {
    expect(assignTokenPreset(undefined, [-1, 1.5, 2], 'p')).toEqual([
      { tokens: [2], presetId: 'p' },
    ]);
  });

  it('an empty selection is a no-op clone (does not mutate input)', () => {
    const input = [{ tokens: [0], presetId: 'p' }];
    const out = assignTokenPreset(input, [], 'p');
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
  });
});

describe('clearTokenPreset', () => {
  it('removes the indices and drops emptied entries', () => {
    expect(
      clearTokenPreset(
        [
          { tokens: [0, 1], presetId: 'a' },
          { tokens: [2], presetId: 'b' },
        ],
        [1, 2]
      )
    ).toEqual([{ tokens: [0], presetId: 'a' }]);
  });

  it('returns [] when every token is cleared', () => {
    expect(
      clearTokenPreset([{ tokens: [0, 1], presetId: 'a' }], [0, 1])
    ).toEqual([]);
  });

  it('returns [] for an undefined list', () => {
    expect(clearTokenPreset(undefined, [0])).toEqual([]);
  });
});

describe('validateAnimationConfig — tokenize fields', () => {
  it("accepts tokenizeMode 'word'", () => {
    const parsed = validateAnimationConfig({ ...base, tokenizeMode: 'word' });
    expect(parsed?.tokenizeMode).toBe('word');
  });

  it('accepts tokenizeMode with tokenAnimations absent', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenizeMode: 'word',
    });
    expect(parsed?.tokenizeMode).toBe('word');
    expect(parsed?.tokenAnimations).toBeUndefined();
  });

  it('drops an empty tokenAnimations array (no entries to keep)', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [],
    });
    expect(parsed?.tokenAnimations).toBeUndefined();
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

  it('drops out-of-domain token indices instead of clamping', () => {
    const parsed = validateAnimationConfig({
      ...base,
      tokenAnimations: [{ tokens: [-3, 1.7, 2, 5], presetId: 'p' }],
    });
    // -3 (negative), 1.7 (non-integer) dropped; 2 and 5 kept as-is.
    expect(parsed?.tokenAnimations).toEqual([
      { tokens: [2, 5], presetId: 'p' },
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
