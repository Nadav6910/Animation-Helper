import type { AnimationConfig, Keyframe } from '@/types/animation';
import { easingToCss } from './easings';
import { transformToCss, filterToCss } from './generateCss';

const num = (n: number) =>
  Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString();

const GRADIENT_RE = /gradient\s*\(/i;
const FIRST_COLOR_RE =
  /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|hwb\([^)]+\)/;

function decls(k: Keyframe, target: AnimationConfig['target']): Record<string, string> {
  const out: Record<string, string> = {};
  const t = transformToCss(k.transform);
  if (t) out.transform = t;
  if (typeof k.opacity === 'number') out.opacity = num(k.opacity);
  if (k.color) {
    if (GRADIENT_RE.test(k.color) && target === 'text') {
      // Gradient text via background-clip: text trick.
      out.background = k.color;
      out.backgroundClip = 'text';
      out.WebkitBackgroundClip = 'text';
      out.color = 'transparent';
    } else if (GRADIENT_RE.test(k.color)) {
      out.color = k.color.match(FIRST_COLOR_RE)?.[0] ?? 'inherit';
    } else {
      out.color = k.color;
    }
  }
  if (k.bg) {
    if (GRADIENT_RE.test(k.bg)) out.background = k.bg;
    else out.backgroundColor = k.bg;
  }
  const f = filterToCss(k);
  if (f) out.filter = f;
  if (typeof k.strokeDashoffset === 'number') {
    out.strokeDashoffset = num(k.strokeDashoffset);
  }
  if (typeof k.offsetDistance === 'number') {
    out.offsetDistance = `${num(k.offsetDistance)}%`;
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

function durationStr(ms: number): string {
  return ms >= 1000 ? `${num(ms / 1000)}s` : `${num(ms)}ms`;
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

  const svgHint =
    c.target === 'svg'
      ? `
// SVG path-draw — apply alongside the animation class:
// <svg viewBox="..."><path d="..." pathLength="100" className="${className} [stroke-dasharray:100]" stroke="currentColor" fill="none" /></svg>
`
      : `
// Apply with:
// <div className="${className}">...</div>
`;

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
