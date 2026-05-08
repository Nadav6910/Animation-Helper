import type { AnimationConfig, Keyframe } from '@/types/animation';
import { easingToCss } from './easings';
import { transformToCss, filterToCss } from './generateCss';
import { sanitisePathD } from './svgPathSafety';

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
  const offsets = sorted.map((k) =>
    +(total > 0 ? (k.at - sorted[0].at) / total : 0).toFixed(4)
  );

  const frames = sorted
    .map((k, i) => {
      const obj = keyframeObj(k);
      obj.offset = offsets[i];
      return `    ${stringify(obj, '    ')}`;
    })
    .join(',\n');

  const easing = easingToCss(c.easing);
  const iterations =
    c.iterations === 'infinite' ? 'Infinity' : num(c.iterations);

  // JSON.stringify quote-escapes the string literal safely; we build the
  // generated `el.animate(...)` body so user-controlled strings (selector,
  // offset-path d) can't break out of their literals.
  const selectorLit = JSON.stringify(selector);
  const easingLit = JSON.stringify(easing);
  const directionLit = JSON.stringify(c.direction);
  const fillLit = JSON.stringify(c.fill);

  // Pre-animation element setup: offset-path and SVG path-draw normalisation
  // need to be set as style/attribute on the element, not as keyframe values.
  const setupLines: string[] = [];
  if (c.offsetPath) {
    const dLit = JSON.stringify(`path('${sanitisePathD(c.offsetPath.d)}')`);
    setupLines.push(`  el.style.offsetPath = ${dLit};`);
    if (c.offsetPath.rotate !== undefined) {
      const r = c.offsetPath.rotate;
      const rotateLit = JSON.stringify(
        typeof r === 'number' ? `${num(r)}deg` : r
      );
      setupLines.push(`  el.style.offsetRotate = ${rotateLit};`);
    }
  }
  if (c.target === 'svg') {
    setupLines.push(
      `  // Path-draw assumes the path uses pathLength="100" so a fixed`
    );
    setupLines.push(`  // dash-array of 100 covers it exactly.`);
    setupLines.push(`  el.setAttribute('stroke-dasharray', '100');`);
  }
  const setup = setupLines.length ? '\n' + setupLines.join('\n') + '\n' : '';

  const animateBlock = `el.animate(
  [
${frames}
  ],
  {
    duration: ${num(c.duration)},
    delay: ${num(c.delay)},
    iterations: ${iterations},
    easing: ${easingLit},
    direction: ${directionLit},
    fill: ${fillLit},
  }
);`;

  if (c.target === 'text' && c.stagger) {
    // For per-letter stagger we animate each child <span> in sequence with
    // a per-element delay offset. Caller is expected to have rendered the
    // text as an inline-block span per character.
    const stepMs = num(c.stagger.step);
    return `// Web Animations API · per-letter stagger
// Markup expectation: <p class="${selector.replace(/^\./, '')}">
//   <span>A</span><span>n</span><span>i</span>...
// </p>
// Run: ${fnName}();
export function ${fnName}() {
  const root = document.querySelector(${selectorLit});
  if (!root) return [];
  const letters = Array.from(root.querySelectorAll(':scope > span'));
  return letters.map((el, i) => ${animateBlock.replace(
    `delay: ${num(c.delay)},`,
    `delay: ${num(c.delay)} + i * ${stepMs},`
  )});
}
`;
  }

  return `// Web Animations API
// Run: ${fnName}();
export function ${fnName}() {
  const el = document.querySelector(${selectorLit});
  if (!el) return null;${setup}
  return ${animateBlock}
}
`;
}
