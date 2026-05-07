import type { AnimationConfig, Keyframe } from '@/types/animation';
import { easingToCss } from './easings';
import { transformToCss, filterToCss } from './generateCss';

const num = (n: number) =>
  Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString();

function decls(k: Keyframe): Record<string, string> {
  const out: Record<string, string> = {};
  const t = transformToCss(k.transform);
  if (t) out.transform = t;
  if (typeof k.opacity === 'number') out.opacity = num(k.opacity);
  if (k.color) out.color = k.color;
  if (k.bg) out.backgroundColor = k.bg;
  const f = filterToCss(k);
  if (f) out.filter = f;
  if (typeof k.strokeDashoffset === 'number') {
    out.strokeDashoffset = num(k.strokeDashoffset);
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
      const d = decls(k);
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
