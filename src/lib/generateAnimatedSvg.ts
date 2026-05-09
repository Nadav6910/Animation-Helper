import type { AnimationConfig } from '@/types/animation';
import {
  buildAnimationShorthand,
  buildKeyframesBody,
  buildRuleDeclLines,
} from './generateCss';
import { SHAPE_BY_KIND } from './shapes';
import { SVG_PATH_BY_ID } from './svgPaths';
import { sanitisePathD } from './svgPathSafety';
import { num } from './css-helpers';

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Make a CSS string safe to embed inside an SVG `<style>` block, in
 * BOTH XML and HTML rendering modes.
 *
 *  - `]]>` would prematurely terminate the CDATA wrapper used for
 *    standalone-SVG mode. Encode the `>`.
 *
 *  - `</style>` and `</svg>` would close the surrounding element when
 *    the SVG is INLINED into an HTML document (GitHub README,
 *    `el.innerHTML = svg`, etc.) — CDATA is not honoured by the HTML
 *    parser in that mode. The CSS spec lets us escape `<` / `/` as
 *    `\3c` / `\2f`, which the CSS tokeniser reads back as the literal
 *    characters but the HTML tag-soup parser can't see — closing the
 *    breakout. Trailing space terminates the escape so a following
 *    hex digit in user CSS isn't absorbed into the sequence.
 *
 *  Per-declaration `}` injection from user-controlled values (color /
 *  bg / dropShadow strings flowing into rule bodies via
 *  `declarationsForKeyframe`) is handled upstream by sanitising the
 *  *value*, not the whole CSS string — see `cssValueSafe` in
 *  `css-helpers.ts`. We can't blanket-encode `}` here because the
 *  CSS structure itself needs literal `}` to close blocks.
 */
const cssBlockSafe = (css: string) =>
  css
    .replace(/]]>/g, ']]&gt;')
    .replace(/<\/style/gi, '\\3c\\2f style')
    .replace(/<\/svg/gi, '\\3c\\2f svg');

export type GenerateAnimatedSvgOptions = {
  className?: string;
  /** Pixel width / height of the resulting SVG. Defaults to 240×240 to
   *  match the live preview's intrinsic size. */
  size?: number;
  /** Mirror of generateCss's cssVars flag — emit timing slots as CSS
   *  variables on the rule and reference them from the shorthand. */
  cssVars?: boolean;
};

/**
 * Emits a single self-contained `.svg` file. The animation is expressed
 * via CSS `<style>` `@keyframes` inside the SVG, which works in every
 * modern browser and renders inline on GitHub README pages.
 *
 * Coverage is the same subset Phase 1's CSS generator emits — transforms,
 * opacity, filters, color/bg, offset-path, gradients (text-clip falls
 * back since `<tspan>` doesn't accept `background-clip: text` cleanly).
 */
export function generateAnimatedSvg(
  c: AnimationConfig,
  opts: GenerateAnimatedSvgOptions = {}
): string {
  const className = opts.className ?? 'animated';
  const size = opts.size ?? 240;
  const animationName = 'play';

  // Build the rule body and keyframes via the canonical IR helpers so a
  // future generator change ripples through this output too. The selector
  // `.${className}` matches the actual rendered element below.
  const ruleLines = buildRuleDeclLines(c, {
    name: animationName,
    indent: '  ',
    cssVars: opts.cssVars,
  });
  const keyframesBody = buildKeyframesBody(c, { indent: '    ' });
  const ruleCss = `.${className} {\n${ruleLines.join('\n')}\n}\n@keyframes ${animationName} {\n${keyframesBody}\n}`;
  const css = cssBlockSafe(ruleCss);

  // Renders the animated target inside the SVG. For shape targets we
  // emulate the rounded-rect / clip-path / mask via raw SVG primitives
  // so the export stays a single file with no external assets.
  let inner: string;
  if (c.target === 'svg') {
    const def = SVG_PATH_BY_ID[c.svgPath ?? 'check'];
    const d = sanitisePathD(def?.d ?? 'M0,0');
    inner = `<g class="${className}">
    <path d="${escapeXml(d)}" pathLength="100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:100" />
  </g>`;
  } else if (c.target === 'text') {
    const text = escapeXml(c.text ?? 'Animate');
    inner = `<text class="${className}" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${num(size / 4)}" font-weight="700" fill="currentColor">${text}</text>`;
  } else {
    const shape = SHAPE_BY_KIND[c.shape ?? 'square'];
    const half = size / 2;
    if (shape.kind === 'circle') {
      inner = `<circle class="${className}" cx="${num(half)}" cy="${num(half)}" r="${num(size * 0.35)}" fill="currentColor" />`;
    } else {
      // For polygon / clip-path-based shapes we fall back to a rect that
      // the CSS clip-path animates. SVG honours CSS clip-path on rect.
      const w = size * 0.7;
      const h = size * 0.7;
      inner = `<rect class="${className}" x="${num((size - w) / 2)}" y="${num((size - h) / 2)}" width="${num(w)}" height="${num(h)}" rx="${shape.borderRadius === '50%' ? num(w / 2) : '12'}" fill="currentColor" />`;
    }
  }

  const accent = '#7c5cff';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(size)} ${num(size)}" width="${num(size)}" height="${num(size)}" color="${accent}" style="overflow:visible">
  <style><![CDATA[
${css.replace(/^/gm, '    ')}
  ]]></style>
  ${inner}
</svg>
`;
}

export function _animationShorthandForTest(c: AnimationConfig): string {
  // Re-exported only so the unit test can sanity-check the shorthand the
  // exported file will emit — no runtime use.
  return buildAnimationShorthand(c, 'play');
}
