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

/** Inside a CDATA-protected `<style>` block we still need to neutralise
 *  `]]>` so the CDATA section can't be terminated early by user-supplied
 *  CSS. The CSS parser silently drops the broken declaration. */
const cssBlockSafe = (css: string) => css.replace(/]]>/g, ']]&gt;');

export type GenerateAnimatedSvgOptions = {
  className?: string;
  /** Pixel width / height of the resulting SVG. Defaults to 240×240 to
   *  match the live preview's intrinsic size. */
  size?: number;
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
  const ruleLines = buildRuleDeclLines(c, { name: animationName, indent: '  ' });
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
