/**
 * Defence-in-depth allow-list for SVG path `d` data.
 *
 * The regex permits only the characters that can appear in a valid `d`
 * attribute: command letters (M m L l H h V v C c S s Q q T t A a Z z),
 * digits, decimal point, comma, sign (+/-), whitespace, and the `e`/`E`
 * exponent marker for scientific notation. Anything else (parentheses,
 * angle brackets, semicolons, quotes, etc.) is rejected.
 *
 * This isn't a parser — it can't reject `MMMM` or unbalanced commands —
 * but it's enough to keep injected `'`/`)`/`;` characters out of CSS
 * `path('...')` interpolations and exported snippets.
 */
const PATH_D_RE = /^[\sMmLlHhVvCcSsQqTtAaZzEe0-9.,\-+]+$/;

export function isSafePathD(d: string): boolean {
  return PATH_D_RE.test(d);
}

/**
 * Returns the input string if it passes {@link isSafePathD}, otherwise a
 * safe fallback (a no-op two-point path). Use at generator boundaries
 * where we'd rather emit a harmless animation than refuse to generate.
 */
export function sanitisePathD(d: string, fallback = 'M0,0 L0,0'): string {
  return isSafePathD(d) ? d : fallback;
}
