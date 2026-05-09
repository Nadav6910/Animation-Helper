import type { AnimationConfig, Keyframe, Transform } from '@/types/animation';
import { easingToCss } from './easings';
import { sanitisePathD } from './svgPathSafety';
import {
  GRADIENT_RE,
  durationStr,
  deg,
  firstColorStop,
  iterationsStr,
  num,
  px,
} from './css-helpers';

export function transformToCss(t: Transform | undefined): string | null {
  if (!t) return null;
  const parts: string[] = [];
  if (typeof t.perspective === 'number' && t.perspective > 0) {
    parts.push(`perspective(${px(t.perspective)})`);
  }
  if (t.translate) {
    const z = typeof t.translateZ === 'number' ? t.translateZ : 0;
    parts.push(
      `translate3d(${px(t.translate[0])}, ${px(t.translate[1])}, ${px(z)})`
    );
  } else if (typeof t.translateZ === 'number' && t.translateZ !== 0) {
    parts.push(`translate3d(0px, 0px, ${px(t.translateZ)})`);
  }
  // CSS transforms are not commutative — emitting both rotate3d() AND
  // rotateX/rotateY in the same `transform` produces order-dependent
  // surprises. Prefer the more expressive form: if a rotate3d is set
  // with a non-zero angle and a non-degenerate axis, use it alone and
  // skip rotateX/Y. A rotate3d with all-zero axis is a CSS no-op so we
  // skip it too.
  const r3d = t.rotate3d;
  const r3dActive =
    !!r3d && r3d.deg !== 0 && (r3d.x !== 0 || r3d.y !== 0 || r3d.z !== 0);
  if (r3dActive && r3d) {
    parts.push(`rotate3d(${num(r3d.x)}, ${num(r3d.y)}, ${num(r3d.z)}, ${deg(r3d.deg)})`);
  } else if (t.rotate) {
    if (t.rotate[0] !== 0) parts.push(`rotateX(${deg(t.rotate[0])})`);
    if (t.rotate[1] !== 0) parts.push(`rotateY(${deg(t.rotate[1])})`);
    if (t.rotate[0] === 0 && t.rotate[1] === 0) {
      parts.push('rotate(0deg)');
    }
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

function declarationsForKeyframe(
  k: Keyframe,
  target: AnimationConfig['target']
): string[] {
  const decls: string[] = [];
  const transform = transformToCss(k.transform);
  if (transform) decls.push(`transform: ${transform};`);
  if (typeof k.opacity === 'number') decls.push(`opacity: ${num(k.opacity)};`);
  if (k.color) {
    if (GRADIENT_RE.test(k.color) && target === 'text') {
      // CSS doesn't allow gradients on `color` directly; the
      // background-clip: text trick clips a gradient background to the
      // text glyphs while making the actual color transparent.
      decls.push(`background: ${k.color};`);
      decls.push(`background-clip: text;`);
      decls.push(`-webkit-background-clip: text;`);
      decls.push(`color: transparent;`);
    } else if (GRADIENT_RE.test(k.color)) {
      // Gradient fill is text-only; for shapes / SVG fall back to the
      // first stop so the element still renders.
      decls.push(`color: ${firstColorStop(k.color)};`);
    } else {
      decls.push(`color: ${k.color};`);
    }
  }
  if (k.bg) {
    const prop = GRADIENT_RE.test(k.bg) ? 'background' : 'background-color';
    decls.push(`${prop}: ${k.bg};`);
  }
  const filter = filterToCss(k);
  if (filter) decls.push(`filter: ${filter};`);
  if (typeof k.strokeDashoffset === 'number') {
    decls.push(`stroke-dashoffset: ${num(k.strokeDashoffset)};`);
  }
  if (typeof k.offsetDistance === 'number') {
    decls.push(`offset-distance: ${num(k.offsetDistance)}%;`);
  }
  if (k.easing) {
    decls.push(`animation-timing-function: ${easingToCss(k.easing)};`);
  }
  return decls;
}

function sortedKeyframes(kfs: Keyframe[]): Keyframe[] {
  return [...kfs].sort((a, b) => a.at - b.at);
}

export type GenerateCssOptions = {
  name?: string;
  indent?: string;
  /** When true, emit timing slots (duration / easing / delay /
   *  iterations) as CSS variables on the rule and reference them via
   *  `var(--ah-...)` in the animation shorthand, so consumers can
   *  override timing without editing the @keyframes. Defaults to
   *  literal values. */
  cssVars?: boolean;
};

/** The `animation: ...` shorthand value (everything after `animation:`),
 *  ready to drop into a CSS rule body or a styled-components template. */
export function buildAnimationShorthand(
  c: AnimationConfig,
  name = 'play',
  opts: { cssVars?: boolean } = {}
): string {
  const dirLit = c.direction !== 'normal' ? ` ${c.direction}` : '';
  const fillLit = c.fill !== 'none' ? ` ${c.fill}` : '';
  if (opts.cssVars) {
    // Reference the rule-level CSS variables emitted by
    // buildRuleDeclLines. Direction / fill stay literal — they're
    // categorical and rarely tuned at runtime, and var() in those
    // positions makes the shorthand harder to scan.
    return `${name} var(--ah-duration) var(--ah-easing) var(--ah-delay) var(--ah-iterations)${dirLit}${fillLit}`.trim();
  }
  const easing = easingToCss(c.easing);
  const dur = durationStr(c.duration);
  const delay = c.delay ? ` ${durationStr(c.delay)}` : ' 0s';
  const iter = ` ${iterationsStr(c.iterations)}`;
  return `${name} ${dur} ${easing}${delay}${iter}${dirLit}${fillLit}`.trim();
}

/** Lines that belong inside the animated element's rule body (without
 *  the `selector {` / `}` brace lines or the `@keyframes` block). Used
 *  by the SCSS @mixin / styled-components / Vue / Svelte wrappers. */
export function buildRuleDeclLines(
  c: AnimationConfig,
  opts: { name?: string; indent?: string; cssVars?: boolean } = {}
): string[] {
  const indent = opts.indent ?? '  ';
  const name = opts.name ?? 'play';
  const lines: string[] = [];
  if (opts.cssVars) {
    // Timing slots as CSS variables — overrideable per-element from
    // the consumer's stylesheet without touching the @keyframes.
    lines.push(`${indent}--ah-duration: ${durationStr(c.duration)};`);
    lines.push(`${indent}--ah-easing: ${easingToCss(c.easing)};`);
    lines.push(
      `${indent}--ah-delay: ${c.delay ? durationStr(c.delay) : '0s'};`
    );
    lines.push(`${indent}--ah-iterations: ${iterationsStr(c.iterations)};`);
  }
  lines.push(
    `${indent}animation: ${buildAnimationShorthand(c, name, { cssVars: opts.cssVars })};`
  );
  if (c.target === 'svg') {
    lines.push(`${indent}stroke-dasharray: 100;`);
  }
  if (c.offsetPath) {
    lines.push(
      `${indent}offset-path: path('${sanitisePathD(c.offsetPath.d)}');`
    );
    if (c.offsetPath.rotate !== undefined) {
      const r = c.offsetPath.rotate;
      const rotate = typeof r === 'number' ? `${num(r)}deg` : r;
      lines.push(`${indent}offset-rotate: ${rotate};`);
    }
  }
  return lines;
}

/** The body of an `@keyframes name { ... }` block — keyframe markers +
 *  declarations only, indented one level inside the @keyframes. */
export function buildKeyframesBody(
  c: AnimationConfig,
  opts: { indent?: string } = {}
): string {
  const indent = opts.indent ?? '  ';
  const lines: string[] = [];
  for (const k of sortedKeyframes(c.keyframes)) {
    const decls = declarationsForKeyframe(k, c.target);
    if (decls.length === 0) continue;
    lines.push(`${indent}${num(k.at)}% {`);
    for (const d of decls) lines.push(`${indent}${indent}${d}`);
    lines.push(`${indent}}`);
  }
  return lines.join('\n');
}

export function generateCss(
  c: AnimationConfig,
  opts: GenerateCssOptions = {}
): string {
  const name = opts.name ?? 'play';
  const indent = opts.indent ?? '  ';
  const ruleSelector = c.selector;
  const lines: string[] = [];
  if (c.target === 'svg') {
    lines.push(
      '/* For path-draw, your <path> needs pathLength="100" so stroke-dasharray:100 covers it exactly. */',
    );
  }
  lines.push(`${ruleSelector} {`);
  for (const ln of buildRuleDeclLines(c, {
    name,
    indent,
    cssVars: opts.cssVars,
  })) {
    lines.push(ln);
  }
  lines.push('}');
  lines.push('');

  if (c.stagger && c.target === 'text') {
    const animationValue = buildAnimationShorthand(c, name, {
      cssVars: opts.cssVars,
    });
    lines.push(`${ruleSelector} > span {`);
    lines.push(`${indent}animation: ${animationValue};`);
    lines.push(
      `${indent}animation-delay: calc(var(--i) * ${num(c.stagger.step)}ms);`
    );
    lines.push(`${indent}display: inline-block;`);
    lines.push('}');
    lines.push('');
  }

  lines.push(`@keyframes ${name} {`);
  const body = buildKeyframesBody(c, { indent });
  if (body) lines.push(body);
  lines.push('}');

  return lines.join('\n');
}
