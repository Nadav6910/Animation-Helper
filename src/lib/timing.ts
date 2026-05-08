import type { AnimationConfig } from '@/types/animation';

/**
 * Total wall-clock length of one full play of a config — delay + duration *
 * iteration count. Infinite presets render as one iteration so the timeline
 * still has a finite ruler to scrub against; once the user reaches the end
 * the animation visually loops at offset 0.
 */
export function totalDuration(c: AnimationConfig): number {
  const delay = Number.isFinite(c.delay) && c.delay > 0 ? c.delay : 0;
  const dur = Number.isFinite(c.duration) && c.duration > 0 ? c.duration : 0;
  const iter =
    typeof c.iterations === 'number' && Number.isFinite(c.iterations) && c.iterations > 0
      ? c.iterations
      : 1;
  return delay + dur * iter;
}

/** Clamp a millisecond value into a config's playable range, accounting
 *  for the leading delay. Used by scrub gestures so the playhead never
 *  reports a negative time or overshoots the last keyframe. */
export function clampTime(ms: number, c: AnimationConfig): number {
  return Math.max(0, Math.min(totalDuration(c), Math.round(ms)));
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
