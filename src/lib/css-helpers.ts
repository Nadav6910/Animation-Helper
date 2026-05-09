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

/**
 * Sanitise a user-supplied CSS *value* before it goes into a rule
 * body. Strips characters that would let the value escape its
 * declaration:
 *
 *   - `;` outside of `cubic-bezier(…)` or `linear-gradient(…)` could
 *     terminate the declaration early and start a new one (`red;
 *     position:fixed; top:0`).
 *   - `}` can close the rule block, letting injected text become a
 *     sibling rule (`red; } body{display:none}`).
 *   - `<` / `>` are HTML metacharacters; even though CSS itself
 *     ignores them, emitting them inside an SVG `<style>` that gets
 *     inlined into HTML is the breakout vector
 *     `</style><script>…</script>`.
 *
 * This is the value-side complement to `cssBlockSafe` (in
 * `generateAnimatedSvg.ts`) which handles the structural side. We
 * preserve `(` / `)` / `,` so functional notation (gradients,
 * transforms, cubic-bezier, drop-shadow) keeps working.
 *
 * Applied in `declarationsForKeyframe` — anywhere a user-controlled
 * `color` / `bg` / `dropShadow` flows into emitted CSS.
 */
export function cssValueSafe(value: string): string {
  if (typeof value !== 'string') return '';
  // Track parentheses so semicolons / commas inside `cubic-bezier(…)`
  // and `linear-gradient(…)` survive (they're meaningful syntax),
  // but bare `;` / `}` outside parentheses are stripped — those are
  // the only ways to end a declaration or a rule.
  let depth = 0;
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ';' || ch === '}')) continue;
    if (ch === '<' || ch === '>') continue;
    out += ch;
  }
  return out;
}
