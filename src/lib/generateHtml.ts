import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';
import { SVG_PATH_BY_ID } from './svgPaths';
import { SHAPE_BY_KIND } from './shapes';
import { sanitisePathD } from './svgPathSafety';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Inside a `<style>` element, the only sequence that terminates the
 * element is `</style` (case-insensitive). Neutralise it by inserting a
 * backslash so the HTML parser doesn't see the closing tag — the CSS
 * parser still treats the rule as broken text and discards it, so any
 * attempted breakout becomes a no-op rather than reaching `<script>`.
 */
const cssBlockSafe = (s: string) => s.replace(/<\/(style)/gi, '<\\/$1');

/** Strip everything that isn't a digit, `-`, `.`, or whitespace from a
 *  SVG `viewBox` so attribute injections can't bleed into other tag
 *  state. Numbers (incl. negative + decimal) are all that's valid. */
const safeViewBox = (vb: string) =>
  /^[\s\-.0-9]+$/.test(vb) ? vb : '0 0 24 24';

const safeClass = (s: string) =>
  /^[A-Za-z_][\w-]*$/.test(s) ? s : 'animated';

function targetMarkup(c: AnimationConfig, className: string): string {
  if (c.target === 'text') {
    const text = escapeHtml(c.text ?? 'Animate');
    if (c.stagger) {
      const letters = [...text]
        .map(
          (ch, i) =>
            `<span style="display:inline-block;--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`
        )
        .join('');
      return `<p class="${className}" style="font: 700 64px/1.1 system-ui, sans-serif">${letters}</p>`;
    }
    return `<p class="${className}" style="font: 700 64px/1.1 system-ui, sans-serif">${text}</p>`;
  }
  if (c.target === 'svg') {
    const def = SVG_PATH_BY_ID[c.svgPath ?? 'check'];
    if (!def) return `<div class="${className}"></div>`;
    const d = sanitisePathD(def.d);
    const viewBox = safeViewBox(def.viewBox);
    return `<svg class="${className}" viewBox="${viewBox}" width="240" height="240" fill="none" stroke="#7c5cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="--accent: #7c5cff">
  <path d="${d}" pathLength="100" style="stroke-dasharray:100" />
</svg>`;
  }
  const shape = SHAPE_BY_KIND[c.shape ?? 'square'];
  const styleParts = ['width:160px', 'height:160px', 'background:#7c5cff'];
  if (shape.borderRadius) styleParts.push(`border-radius:${shape.borderRadius}`);
  if (shape.clipPath) styleParts.push(`clip-path:${shape.clipPath}`);
  return `<div class="${className}" style="${styleParts.join(';')}"></div>`;
}

export type GenerateHtmlOptions = {
  className?: string;
  title?: string;
};

export function generateHtml(
  c: AnimationConfig,
  opts: GenerateHtmlOptions = {}
): string {
  const className = safeClass(opts.className ?? 'animated');
  const title = opts.title ?? 'Animation Helper export';
  const css = cssBlockSafe(
    generateCss({ ...c, selector: `.${className}` }, { name: 'play' })
  );
  const markup = targetMarkup(c, className);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { height: 100%; margin: 0; }
    body {
      display: grid;
      place-items: center;
      background: #0b0b14;
      color: #f3f3f7;
      font-family: system-ui, sans-serif;
    }
${css.replace(/^/gm, '    ')}
  </style>
</head>
<body>
  ${markup}
</body>
</html>
`;
}
