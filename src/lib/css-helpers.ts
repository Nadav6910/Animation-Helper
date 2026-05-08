/**
 * Tiny helpers shared by every code generator.
 *
 * Keeping these here avoids drift across generateCss/Tailwind/Framer/
 * WAAPI/etc. The reviews flagged at least three places where `num`,
 * `durationStr`, or the gradient regex had been silently re-implemented
 * with subtle differences.
 */

/** Detects any CSS gradient function (linear-, radial-, conic- including
 *  `repeating-` variants). Loose by design — used to switch
 *  `background-color` ↔ `background` and to trigger the
 *  background-clip:text fallback. */
export const GRADIENT_RE = /gradient\s*\(/i;

/** First colour-like token in a value: hex, rgba/rgb, hsla/hsl, or hwb. */
export const FIRST_COLOR_RE =
  /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|hwb\([^)]+\)/;

/** First colour stop, with `inherit` as a safe fallback for unparseable
 *  inputs so we never emit a literal that breaks the cascade. */
export function firstColorStop(value: string): string {
  return value.match(FIRST_COLOR_RE)?.[0] ?? 'inherit';
}

/** Compact numeric serialiser: integers stay integer-looking; floats
 *  round to 3 decimals and drop trailing zeros. */
export function num(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(3)).toString();
}

/** Pixel literal — `12` becomes `'12px'`. */
export const px = (n: number) => `${num(n)}px`;
/** Degree literal — `45` becomes `'45deg'`. */
export const deg = (n: number) => `${num(n)}deg`;

/** Milliseconds → CSS duration in the most natural unit. Sub-second
 *  values stay `ms` so animations under 1s read clearly; non-finite or
 *  negative inputs collapse to `0ms` rather than producing invalid CSS. */
export function durationStr(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0ms';
  return ms >= 1000 ? `${num(ms / 1000)}s` : `${num(ms)}ms`;
}

/** Iteration-count keyword. */
export function iterationsStr(it: number | 'infinite'): string {
  return it === 'infinite' ? 'infinite' : num(it);
}
