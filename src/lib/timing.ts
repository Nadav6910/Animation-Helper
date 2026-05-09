import type { AnimationConfig } from '@/types/animation';

/**
 * Total wall-clock length the timeline covers, with two wrinkles:
 *
 * 1. **Infinite + alternate.** Infinite renders ONE perceptual loop.
 *    For `direction: alternate` / `alternate-reverse`, one perceptual
 *    loop is forward + reverse — two iterations of `duration`. For
 *    `normal` / `reverse` it's one iteration. The ruler maps to one
 *    visible cycle, not one underlying iteration (which for alternate
 *    animations meant the playhead raced across twice per cycle).
 *    Finite iterations use the literal count regardless of direction
 *    — the user explicitly chose "play this 3 times" so 3× duration
 *    is what the ruler shows.
 *
 * 2. **Stagger on text.** With per-letter stagger the last letter
 *    starts `step × (n − 1)` ms after the first, so the group's
 *    wall-clock span is longer than a single letter's timing. The
 *    parent rule uses the base `delay`; letters override delay with
 *    `--i × step`, so the latest start is `max(delay, step × (n − 1))`.
 *    Add the iteration time on top so the ruler always covers every
 *    letter's last frame.
 */
export function totalDuration(c: AnimationConfig): number {
  const delay = Number.isFinite(c.delay) && c.delay > 0 ? c.delay : 0;
  const dur = Number.isFinite(c.duration) && c.duration > 0 ? c.duration : 0;

  // How many ms the last staggered letter starts after the first.
  // Only text + stagger contributes; everything else is a single
  // animation aligned at `delay`.
  let staggerOffset = 0;
  if (
    c.stagger &&
    c.target === 'text' &&
    Number.isFinite(c.stagger.step) &&
    c.stagger.step > 0
  ) {
    const text =
      typeof c.text === 'string' && c.text.length > 0 ? c.text : 'Animate';
    staggerOffset = Math.max(0, text.length - 1) * c.stagger.step;
  }

  const startOffset = Math.max(delay, staggerOffset);

  if (c.iterations === 'infinite') {
    const isAlternate =
      c.direction === 'alternate' || c.direction === 'alternate-reverse';
    return startOffset + dur * (isAlternate ? 2 : 1);
  }
  const iter =
    typeof c.iterations === 'number' && Number.isFinite(c.iterations) && c.iterations > 0
      ? c.iterations
      : 1;
  return startOffset + dur * iter;
}

/** Clamp a millisecond value into a config's playable range, accounting
 *  for the leading delay. Used by scrub gestures so the playhead never
 *  reports a negative time or overshoots the last keyframe. */
export function clampTime(ms: number, c: AnimationConfig): number {
  return Math.max(0, Math.min(totalDuration(c), Math.round(ms)));
}

/**
 * Whether the config produces a *visibly* animating element. True iff
 * the keyframes carry at least one differing animatable property that
 * the current target actually renders; if every keyframe has identical
 * values (or the only diffs are properties the target doesn't honour,
 * e.g. `strokeDashoffset` on a shape) the WAAPI animation still runs
 * but visually nothing moves, so the timeline UI should reflect "no
 * animation defined" instead of pretending to play.
 *
 * Target-aware comparison: `strokeDashoffset` only counts for SVG
 * paths — shapes / text don't have a stroke-dasharray to offset, so
 * a strokeDashoffset diff there is silent. Without this gate the
 * "switch target svg → shape" path leaves stroke-draw keyframes
 * behind and the timeline lies about playing.
 */
export function hasMeaningfulAnimation(c: AnimationConfig): boolean {
  if (!c.keyframes || c.keyframes.length < 2) return false;
  const isSvg = c.target === 'svg';
  const sig = (k: AnimationConfig['keyframes'][number]): string => {
    const base: Record<string, unknown> = {
      transform: k.transform ?? null,
      opacity: typeof k.opacity === 'number' ? k.opacity : null,
      color: k.color ?? null,
      bg: k.bg ?? null,
      blur: typeof k.blur === 'number' ? k.blur : null,
      hueRotate: typeof k.hueRotate === 'number' ? k.hueRotate : null,
      dropShadow: k.dropShadow ?? null,
      offsetDistance:
        typeof k.offsetDistance === 'number' ? k.offsetDistance : null,
    };
    if (isSvg) {
      base.strokeDashoffset =
        typeof k.strokeDashoffset === 'number' ? k.strokeDashoffset : null;
    }
    return JSON.stringify(base);
  };
  const first = sig(c.keyframes[0]);
  return c.keyframes.some((k) => sig(k) !== first);
}

/** Format milliseconds for the timeline ruler / scrub label. Sub-second
 *  values stay in `ms` so a 700 ms preset reads naturally; ≥ 1 second
 *  uses one decimal place of seconds. */
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  return seconds >= 10 ? `${seconds.toFixed(1)}s` : `${seconds.toFixed(2)}s`;
}
