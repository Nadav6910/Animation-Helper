import type { Easing, EasingPreset, StepsJump } from '@/types/animation';

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

const PRESET_NAMES: readonly EasingPreset[] = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
];

/**
 * Numeric tolerance used by UI to decide whether a cubic-bezier value
 * "matches" a known preset or starter — set to the same precision as
 * BezierEditor's `round3()` so that a chip stays lit through round-trip
 * edits and de-activates the moment a drag introduces a real change.
 * Single-sourced here so a future precision change updates everywhere.
 */
export const EASING_VALUE_TOLERANCE = 0.001;

// Spec-defined cubic-bezier approximations for the named CSS easings
// (per https://drafts.csswg.org/css-easing/#valdef-easing-function-ease).
// Used purely for visualisation — the engine still emits the named
// keyword form, so generated CSS round-trips the original name.
const PRESET_TO_CUBIC: Record<EasingPreset, [number, number, number, number]> =
  {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
  };

/**
 * Returns the cubic-bezier control points that visually represent the
 * given easing, or `null` for easings that don't have a continuous
 * curve (steps). Used by UI thumbnails — the actual CSS output uses
 * the original easing form via `easingToCss`.
 */
export function easingToCubicPreview(
  e: Easing
): [number, number, number, number] | null {
  if (e.kind === 'preset') return PRESET_TO_CUBIC[e.value];
  if (e.kind === 'cubic') return e.v;
  return null;
}

/**
 * Curated cubic-bezier starters surfaced inside the Cubic tab — these
 * complement the basic `EASING_PRESETS` (which mix CSS-spec keywords
 * with our own spring / bounce / elastic / sharp / gentle) by adding
 * the "named curves from easings.net" that designers ask for. Picked
 * so each has a distinct shape from anything in EASING_PRESETS.
 *
 * Curve values match the canonical control points published at
 * https://easings.net. The control-point tuples themselves are
 * mathematical constants derived from Robert Penner's original
 * equations and are not subject to copyright; we cite easings.net
 * as a courtesy and to anchor the names users will Google.
 *
 * camelCase names match easings.net's published identifiers
 * verbatim — designers searching docs type "easeOutQuint", not
 * "ease-out-quint" — even though `EASING_PRESETS` above uses
 * kebab-case for the CSS-spec keywords.
 */
export const CUBIC_QUICK_STARTERS: {
  name: string;
  v: [number, number, number, number];
}[] = [
  { name: 'easeOutQuint', v: [0.22, 1, 0.36, 1] },
  { name: 'easeOutBack', v: [0.34, 1.56, 0.64, 1] },
  { name: 'easeInOutCirc', v: [0.85, 0, 0.15, 1] },
  { name: 'easeOutCirc', v: [0, 0.55, 0.45, 1] },
  { name: 'easeInExpo', v: [0.7, 0, 0.84, 0] },
  { name: 'easeOutExpo', v: [0.16, 1, 0.3, 1] },
];

const STEPS_JUMPS: readonly StepsJump[] = ['start', 'end', 'none', 'both'];

/**
 * Parse a user-supplied easing string into the internal `Easing`
 * representation. Returns `null` for malformed input — the caller is
 * responsible for surfacing a user-facing error.
 *
 * Accepts:
 *  - Named presets: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`
 *  - CSS cubic-bezier form: `cubic-bezier(0.4, 0, 0.2, 1)` (case-insensitive,
 *    flexible whitespace; X1 / X2 must be in [0, 1] per the CSS spec)
 *  - Raw 4-number tuple: `0.4, 0, 0.2, 1` — convenience for pasting from
 *    tools that only emit the numbers
 *  - Steps function: `steps(4)`, `steps(4, end)`, `steps(4, jump-end)`,
 *    plus the `step-start` / `step-end` keyword shorthands
 *
 * Numeric parsing is strict: scientific notation, hex, plus signs, and
 * lone decimal points are rejected because the CSS spec doesn't allow
 * them and accepting them would mask user typos.
 */
export function parseEasing(input: string): Easing | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if ((PRESET_NAMES as readonly string[]).includes(trimmed)) {
    return { kind: 'preset', value: trimmed as EasingPreset };
  }

  if (trimmed === 'step-start') return { kind: 'steps', n: 1, jump: 'start' };
  if (trimmed === 'step-end') return { kind: 'steps', n: 1, jump: 'end' };

  // Numeric literal pattern: optional minus, then either
  //   - digits with optional fractional part (e.g. `0`, `0.5`, `1.`)
  //   - OR a leading decimal followed by digits (e.g. `.5`)
  // Rejects `+`, scientific notation, double dots, and lone dots. Both
  // trailing-dot (`1.`) and leading-dot (`.5`) forms are accepted to
  // match CSS's <number> grammar, since both are common in pasted CSS.
  const NUM = '(-?(?:\\d+\\.?\\d*|\\.\\d+))';
  const SEP = '\\s*,\\s*';
  const cubicRe = new RegExp(
    `^cubic-bezier\\s*\\(\\s*${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}\\s*\\)$`
  );
  const rawRe = new RegExp(`^${NUM}${SEP}${NUM}${SEP}${NUM}${SEP}${NUM}$`);

  const cubicMatch = trimmed.match(cubicRe) ?? trimmed.match(rawRe);
  if (cubicMatch) {
    const nums = [1, 2, 3, 4].map((i) => Number(cubicMatch[i])) as [
      number,
      number,
      number,
      number,
    ];
    if (!nums.every(Number.isFinite)) return null;
    // Per CSS spec, X1 and X2 must be in [0, 1]; Y can be anything (overshoot
    // / undershoot is how easeOutBack etc. are expressed).
    if (nums[0] < 0 || nums[0] > 1 || nums[2] < 0 || nums[2] > 1) return null;
    return { kind: 'cubic', v: nums };
  }

  const stepsRe = /^steps\s*\(\s*(\d+)(?:\s*,\s*(jump-(?:start|end|none|both)|start|end))?\s*\)$/;
  const stepsMatch = trimmed.match(stepsRe);
  if (stepsMatch) {
    const n = Number(stepsMatch[1]);
    if (!Number.isFinite(n) || n < 1) return null;
    let jump: StepsJump = 'end';
    const mod = stepsMatch[2];
    if (mod) {
      if (mod === 'start') jump = 'start';
      else if (mod === 'end') jump = 'end';
      else {
        const stripped = mod.replace(/^jump-/, '') as StepsJump;
        if (!(STEPS_JUMPS as readonly string[]).includes(stripped)) return null;
        jump = stripped;
      }
    }
    return { kind: 'steps', n: Math.round(n), jump };
  }

  return null;
}
