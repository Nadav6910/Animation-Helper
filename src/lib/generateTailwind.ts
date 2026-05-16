import type { AnimationConfig, Keyframe } from '@/types/animation';
import { easingToCss } from './easings';
import { transformToCss, filterToCss } from './generateCss';
import { hasTokenAnimations, tokenizeModeOf } from './tokenize';
import {
  GRADIENT_RE,
  cssValueSafe,
  durationStr,
  firstColorStop,
  num,
} from './css-helpers';

function decls(k: Keyframe, target: AnimationConfig['target']): Record<string, string> {
  const out: Record<string, string> = {};
  const t = transformToCss(k.transform);
  if (t) out.transform = t;
  if (typeof k.opacity === 'number') out.opacity = num(k.opacity);
  if (k.color) {
    // Same value-side sanitisation as the CSS generator — Tailwind
    // emits these inside JS string literals so they can't break out
    // of JS, but the consumer's project re-emits them as CSS
    // declarations, where unsanitised `;` / `}` would inject
    // arbitrary rules into the host stylesheet.
    const safeColor = cssValueSafe(k.color);
    if (GRADIENT_RE.test(safeColor) && target === 'text') {
      out.background = safeColor;
      out.backgroundClip = 'text';
      out.WebkitBackgroundClip = 'text';
      out.color = 'transparent';
    } else if (GRADIENT_RE.test(safeColor)) {
      out.color = firstColorStop(safeColor);
    } else {
      out.color = safeColor;
    }
  }
  if (k.bg) {
    const safeBg = cssValueSafe(k.bg);
    if (GRADIENT_RE.test(safeBg)) out.background = safeBg;
    else out.backgroundColor = safeBg;
  }
  const f = filterToCss(k);
  if (f) out.filter = f;
  if (typeof k.strokeDashoffset === 'number') {
    out.strokeDashoffset = num(k.strokeDashoffset);
  }
  if (typeof k.offsetDistance === 'number') {
    out.offsetDistance = `${num(k.offsetDistance)}%`;
  }
  if (k.clipPath) {
    // Same sanitisation as the CSS generator — strip declaration
    // terminators so a tampered value can't break out of the
    // generated config object.
    out.clipPath = cssValueSafe(k.clipPath);
  }
  if (k.easing) {
    out.animationTimingFunction = easingToCss(k.easing);
  }
  return out;
}

function quoteKey(k: string): string {
  return /^[a-zA-Z_$][\w$]*$/.test(k) ? k : `'${k}'`;
}

function stringifyDecls(d: Record<string, string>, indent: string): string {
  const keys = Object.keys(d);
  if (keys.length === 0) return '{}';
  const lines = keys.map(
    (k) => `${indent}  ${quoteKey(k)}: '${d[k].replace(/'/g, "\\'")}',`
  );
  return `{\n${lines.join('\n')}\n${indent}}`;
}

export type GenerateTailwindOptions = {
  name?: string;
  className?: string;
};

export function generateTailwind(
  c: AnimationConfig,
  opts: GenerateTailwindOptions = {}
): string {
  const name = opts.name ?? 'play';
  const className = opts.className ?? `animate-${name}`;
  const sorted = [...c.keyframes].sort((a, b) => a.at - b.at);

  const keyframeBody = sorted
    .map((k) => {
      const d = decls(k, c.target);
      if (Object.keys(d).length === 0) return null;
      return `      '${num(k.at)}%': ${stringifyDecls(d, '      ')},`;
    })
    .filter(Boolean)
    .join('\n');

  const easing = easingToCss(c.easing);
  const dur = durationStr(c.duration);
  const delay = durationStr(c.delay);
  const iter = c.iterations === 'infinite' ? 'infinite' : num(c.iterations);
  const dir = c.direction !== 'normal' ? ` ${c.direction}` : '';
  const fill = c.fill !== 'none' ? ` ${c.fill}` : '';
  const animValue = `${name} ${dur} ${easing} ${delay} ${iter}${dir}${fill}`.trim();

  let usageHint: string;
  if (c.target === 'svg') {
    usageHint = `
// SVG path-draw — apply alongside the animation class:
// <svg viewBox="..."><path d="..." pathLength="100" className="${className} [stroke-dasharray:100]" stroke="currentColor" fill="none" /></svg>
`;
  } else if (c.target === 'text' && (c.stagger || hasTokenAnimations(c))) {
    const heading = c.stagger ? 'Per-letter stagger' : 'Per-token text';
    const delayLine = c.stagger
      ? `//     animation-delay: calc(var(--i) * ${num(c.stagger.step)}ms);\n`
      : '';
    // The split example must match how this app actually tokenizes the
    // text, otherwise the per-token `data-anim` selectors won't line up.
    const splitExample =
      tokenizeModeOf(c) === 'word'
        ? `//   <p className="${className}">{'Animate this'.split(/(\\s+)/).map((tok, i) => (
//     <span key={i} style={{ '--i': i }}>{tok}</span>
//   ))}</p>`
        : `//   <p className="${className}">{[...'Animate'].map((ch, i) => (
//     <span key={i} style={{ '--i': i }}>{ch}</span>
//   ))}</p>`;
    const perTokenNote = hasTokenAnimations(c)
      ? `//
// This animation has PER-TOKEN overrides, which need one extra
// @keyframes + \`> span[data-anim="…"]\` rule per preset. Tailwind
// config can't express those — copy the CSS export instead for the
// full per-token output (it includes the markup-matching selectors).
`
      : '';
    usageHint = `
// ${heading} — Tailwind config can't express the descendant
// selector + CSS variable, so add this rule to your global stylesheet:
//   .${className} > span {
//     animation: ${animValue};
${delayLine}//     display: inline-block;
//   }
// Then split the text (matching this tool's ${tokenizeModeOf(c)} tokenization):
${splitExample}
${perTokenNote}`;
  } else {
    usageHint = `
// Apply with:
// <div className="${className}">...</div>
`;
  }
  const svgHint = usageHint;

  return `// tailwind.config.{js,ts}
module.exports = {
  theme: {
    extend: {
      keyframes: {
        ${name}: {
${keyframeBody}
        },
      },
      animation: {
        '${name}': '${animValue}',
      },
    },
  },
};
${svgHint}`;
}
