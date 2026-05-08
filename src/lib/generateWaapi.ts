import type { AnimationConfig, Keyframe } from '@/types/animation';
import { easingToCss } from './easings';
import { transformToCss, filterToCss } from './generateCss';

const num = (n: number) =>
  Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString();

function keyframeObj(k: Keyframe): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const t = transformToCss(k.transform);
  if (t) out.transform = t;
  if (typeof k.opacity === 'number') out.opacity = k.opacity;
  if (k.color) out.color = k.color;
  if (k.bg) {
    if (/gradient\s*\(/i.test(k.bg)) out.background = k.bg;
    else out.backgroundColor = k.bg;
  }
  const f = filterToCss(k);
  if (f) out.filter = f;
  if (typeof k.strokeDashoffset === 'number')
    out.strokeDashoffset = k.strokeDashoffset;
  if (typeof k.offsetDistance === 'number')
    out.offsetDistance = `${num(k.offsetDistance)}%`;
  if (k.easing) out.easing = easingToCss(k.easing);
  return out;
}

function fmtVal(v: string | number): string {
  return typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : num(v);
}

function stringify(o: Record<string, string | number>, indent: string): string {
  const keys = Object.keys(o);
  if (keys.length === 0) return '{}';
  return (
    '{\n' +
    keys
      .map((k) => `${indent}  ${k}: ${fmtVal(o[k])},`)
      .join('\n') +
    `\n${indent}}`
  );
}

export type GenerateWaapiOptions = {
  selector?: string;
  fnName?: string;
};

export function generateWaapi(
  c: AnimationConfig,
  opts: GenerateWaapiOptions = {}
): string {
  const selector = opts.selector ?? c.selector ?? '.animated';
  const fnName = opts.fnName ?? 'play';
  const sorted = [...c.keyframes].sort((a, b) => a.at - b.at);
  const total = sorted.length > 1 ? sorted[sorted.length - 1].at - sorted[0].at : 100;
  const offsets = sorted.map((k) => +(((k.at - sorted[0].at) / total) || 0).toFixed(4));

  const frames = sorted
    .map((k, i) => {
      const obj = keyframeObj(k);
      obj.offset = offsets[i];
      return `  ${stringify(obj, '  ')}`;
    })
    .join(',\n');

  const easing = easingToCss(c.easing);
  const iterations =
    c.iterations === 'infinite' ? 'Infinity' : num(c.iterations);
  const direction = `'${c.direction}'`;
  const fill = `'${c.fill}'`;

  return `// Web Animations API
// Run: ${fnName}();
export function ${fnName}() {
  const el = document.querySelector('${selector}');
  if (!el) return null;
  return el.animate(
[
${frames}
  ],
  {
    duration: ${num(c.duration)},
    delay: ${num(c.delay)},
    iterations: ${iterations},
    easing: '${easing}',
    direction: ${direction},
    fill: ${fill},
  }
  );
}
`;
}
