import type { AnimationConfig, Keyframe, Transform } from '@/types/animation';
import { easingToCss } from './easings';

const num = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(3)).toString();
};

const px = (n: number) => `${num(n)}px`;
const deg = (n: number) => `${num(n)}deg`;

export function transformToCss(t: Transform | undefined): string | null {
  if (!t) return null;
  const parts: string[] = [];
  if (t.translate) {
    parts.push(`translate3d(${px(t.translate[0])}, ${px(t.translate[1])}, 0)`);
  }
  if (t.rotate) {
    if (t.rotate[0] !== 0) parts.push(`rotateX(${deg(t.rotate[0])})`);
    if (t.rotate[1] !== 0) parts.push(`rotateY(${deg(t.rotate[1])})`);
    if (t.rotate[0] === 0 && t.rotate[1] === 0) parts.push('rotate(0deg)');
  }
  if (t.skew) {
    if (t.skew[0] !== 0 || t.skew[1] !== 0) {
      parts.push(`skew(${deg(t.skew[0])}, ${deg(t.skew[1])})`);
    }
  }
  if (t.scale) {
    parts.push(`scale(${num(t.scale[0])}, ${num(t.scale[1])})`);
  }
  return parts.length ? parts.join(' ') : null;
}

export function filterToCss(k: Keyframe): string | null {
  const parts: string[] = [];
  if (typeof k.blur === 'number' && k.blur > 0) parts.push(`blur(${num(k.blur)}px)`);
  if (typeof k.hueRotate === 'number' && k.hueRotate !== 0) {
    parts.push(`hue-rotate(${num(k.hueRotate)}deg)`);
  }
  if (k.dropShadow) parts.push(`drop-shadow(${k.dropShadow})`);
  return parts.length ? parts.join(' ') : null;
}

function declarationsForKeyframe(k: Keyframe): string[] {
  const decls: string[] = [];
  const transform = transformToCss(k.transform);
  if (transform) decls.push(`transform: ${transform};`);
  if (typeof k.opacity === 'number') decls.push(`opacity: ${num(k.opacity)};`);
  if (k.color) decls.push(`color: ${k.color};`);
  if (k.bg) decls.push(`background-color: ${k.bg};`);
  const filter = filterToCss(k);
  if (filter) decls.push(`filter: ${filter};`);
  if (typeof k.strokeDashoffset === 'number') {
    decls.push(`stroke-dashoffset: ${num(k.strokeDashoffset)};`);
  }
  return decls;
}

function sortedKeyframes(kfs: Keyframe[]): Keyframe[] {
  return [...kfs].sort((a, b) => a.at - b.at);
}

function durationStr(ms: number): string {
  if (ms >= 1000) return `${num(ms / 1000)}s`;
  return `${num(ms)}ms`;
}

function iterationsStr(it: number | 'infinite'): string {
  return it === 'infinite' ? 'infinite' : num(it);
}

export type GenerateCssOptions = {
  name?: string;
  indent?: string;
};

export function generateCss(
  c: AnimationConfig,
  opts: GenerateCssOptions = {}
): string {
  const name = opts.name ?? 'play';
  const indent = opts.indent ?? '  ';
  const easing = easingToCss(c.easing);
  const dur = durationStr(c.duration);
  const delay = c.delay ? ` ${durationStr(c.delay)}` : ' 0s';
  const iter = ` ${iterationsStr(c.iterations)}`;
  const dir = c.direction !== 'normal' ? ` ${c.direction}` : '';
  const fill = c.fill !== 'none' ? ` ${c.fill}` : '';
  const animationValue = `${name} ${dur} ${easing}${delay}${iter}${dir}${fill}`.trim();

  const ruleSelector = c.selector;
  const lines: string[] = [];
  if (c.target === 'svg') {
    lines.push(
      '/* For path-draw, your <path> needs pathLength="100" so stroke-dasharray:100 covers it exactly. */',
    );
  }
  lines.push(`${ruleSelector} {`);
  lines.push(`${indent}animation: ${animationValue};`);
  if (c.target === 'svg') {
    lines.push(`${indent}stroke-dasharray: 100;`);
  }
  lines.push('}');
  lines.push('');

  if (c.stagger && c.target === 'text') {
    lines.push(`${ruleSelector} > span {`);
    lines.push(
      `${indent}animation: ${animationValue};`,
    );
    lines.push(
      `${indent}animation-delay: calc(var(--i) * ${num(c.stagger.step)}ms);`,
    );
    lines.push(
      `${indent}display: inline-block;`,
    );
    lines.push('}');
    lines.push('');
  }

  lines.push(`@keyframes ${name} {`);
  for (const k of sortedKeyframes(c.keyframes)) {
    const decls = declarationsForKeyframe(k);
    if (decls.length === 0) continue;
    lines.push(`${indent}${num(k.at)}% {`);
    for (const d of decls) lines.push(`${indent}${indent}${d}`);
    lines.push(`${indent}}`);
  }
  lines.push('}');

  return lines.join('\n');
}
