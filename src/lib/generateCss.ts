import type { AnimationConfig, Keyframe, Transform } from '@/types/animation';
import { easingToCss } from './easings';
import { getPreset } from './presets';
import { hasTokenAnimations } from './tokenize';
import { sanitisePathD } from './svgPathSafety';
import {
  GRADIENT_RE,
  cssValueSafe,
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
  if (k.dropShadow) {
    // Same security rationale as `color` / `bg` — strip declaration-
    // breakout characters before embedding the user string inside the
    // `drop-shadow(…)` functional. cssValueSafe preserves parens /
    // commas so a real shadow like "0 4px 8px rgba(0,0,0,.3)" survives.
    parts.push(`drop-shadow(${cssValueSafe(k.dropShadow)})`);
  }
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
    // User-supplied colour / gradient strings flow straight into rule
    // bodies — sanitise via `cssValueSafe` so a value like
    // `"red; } body{display:none}"` can't break out of its
    // declaration and inject sibling rules into the host stylesheet.
    // Especially load-bearing for the animated-SVG export path which
    // can be inlined into HTML where `</style>` would otherwise let
    // a script tag escape into the document.
    const safeColor = cssValueSafe(k.color);
    if (GRADIENT_RE.test(safeColor) && target === 'text') {
      // CSS doesn't allow gradients on `color` directly; the
      // background-clip: text trick clips a gradient background to the
      // text glyphs while making the actual color transparent.
      decls.push(`background: ${safeColor};`);
      decls.push(`background-clip: text;`);
      decls.push(`-webkit-background-clip: text;`);
      decls.push(`color: transparent;`);
    } else if (GRADIENT_RE.test(safeColor)) {
      // Gradient fill is text-only; for shapes / SVG fall back to the
      // first stop so the element still renders.
      decls.push(`color: ${firstColorStop(safeColor)};`);
    } else {
      decls.push(`color: ${safeColor};`);
    }
  }
  if (k.bg) {
    const safeBg = cssValueSafe(k.bg);
    const prop = GRADIENT_RE.test(safeBg) ? 'background' : 'background-color';
    decls.push(`${prop}: ${safeBg};`);
  }
  const filter = filterToCss(k);
  if (filter) decls.push(`filter: ${filter};`);
  if (typeof k.strokeDashoffset === 'number') {
    decls.push(`stroke-dashoffset: ${num(k.strokeDashoffset)};`);
  }
  if (typeof k.offsetDistance === 'number') {
    decls.push(`offset-distance: ${num(k.offsetDistance)}%;`);
  }
  if (k.clipPath) {
    // Sanitise the same way every other untrusted CSS value is —
    // strip declaration breakouts (`;`, `}`, `<`, `>`) so a tampered
    // share URL can't smuggle sibling rules into the generated
    // stylesheet. Polygon strings produced by the custom-shape
    // editor never contain those characters, but the field is also
    // writable via paste, URL hash, and localStorage so the
    // sanitiser is the trust boundary.
    decls.push(`clip-path: ${cssValueSafe(k.clipPath)};`);
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
 *  ready to drop into a CSS rule body or a styled-components template.
 *  In `cssVars` mode this returns just the animation-name — the timing
 *  slots are emitted as separate `animation-*` longhands by
 *  `buildRuleDeclLines`, which reference the `--ah-*` variables. The
 *  shorthand can't carry `var()` in positional slots because the CSS
 *  parser would have to bind by type at compute-time and inter-slot
 *  ambiguity (e.g. `var(--ah-iterations)` resolving to a duration)
 *  makes the result browser-dependent. Longhands have one slot per
 *  property, so the binding is unambiguous. */
export function buildAnimationShorthand(
  c: AnimationConfig,
  name = 'play',
  opts: { cssVars?: boolean } = {}
): string {
  if (opts.cssVars) {
    return name;
  }
  const dirLit = c.direction !== 'normal' ? ` ${c.direction}` : '';
  const fillLit = c.fill !== 'none' ? ` ${c.fill}` : '';
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
    // Emit longhands referencing each variable in its own one-slot
    // property. This is the unambiguous form — the shorthand path
    // (animation: name var(--a) var(--b) …) makes the parser guess
    // which longhand each var() binds to, and browsers disagree.
    lines.push(
      `${indent}animation-name: ${buildAnimationShorthand(c, name, { cssVars: true })};`
    );
    lines.push(`${indent}animation-duration: var(--ah-duration);`);
    lines.push(`${indent}animation-timing-function: var(--ah-easing);`);
    lines.push(`${indent}animation-delay: var(--ah-delay);`);
    lines.push(`${indent}animation-iteration-count: var(--ah-iterations);`);
    if (c.direction !== 'normal') {
      lines.push(`${indent}animation-direction: ${c.direction};`);
    }
    if (c.fill !== 'none') {
      lines.push(`${indent}animation-fill-mode: ${c.fill};`);
    }
  } else {
    lines.push(
      `${indent}animation: ${buildAnimationShorthand(c, name)};`
    );
  }
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

/** Hard ceiling on distinct per-token presets emitted into a single
 *  stylesheet. Each adds one `@keyframes` block + one selector rule;
 *  capping keeps the snippet (and the shared share-URL blob) bounded.
 *  Tokens whose preset is past the cap silently fall back to the
 *  config's global animation — the same graceful degradation an
 *  unknown / stale presetId gets. */
export const PER_TOKEN_PRESET_CAP = 20;

export type ResolvedTokenPreset = {
  presetId: string;
  /** Safe `@keyframes` ident — derived from a counter, never from the
   *  (validator-bounded but charset-unrestricted) presetId. */
  kfName: string;
  /** The preset's own built config — its keyframes / duration / easing
   *  / iterations drive this token independently of the global. */
  cfg: AnimationConfig;
};

/**
 * Distinct, resolvable per-token presets in first-appearance order,
 * capped at {@link PER_TOKEN_PRESET_CAP}. A presetId that doesn't
 * resolve to a real preset is skipped entirely (the token falls back
 * to the global animation via the base `> span` rule) — this is the
 * graceful-degradation contract `resolveTokenPreset`'s doc-comment
 * promises. Exported so the non-CSS generators resolve the exact same
 * set / order / cap and stay consistent with the CSS output.
 */
export function resolveTokenPresets(
  c: AnimationConfig,
  name = 'play'
): ResolvedTokenPreset[] {
  if (c.target !== 'text' || !c.tokenAnimations?.length) return [];
  const seen = new Set<string>();
  const out: ResolvedTokenPreset[] = [];
  for (const entry of c.tokenAnimations) {
    const pid = entry.presetId;
    if (seen.has(pid)) continue;
    seen.add(pid);
    const preset = getPreset(pid);
    if (!preset) continue;
    out.push({
      presetId: pid,
      kfName: `${name}-tok-${out.length + 1}`,
      cfg: preset.build(),
    });
    if (out.length >= PER_TOKEN_PRESET_CAP) break;
  }
  return out;
}

/** Escape a string for use inside a double-quoted attribute-selector
 *  value. Resolvable presetIds are registry slugs (`[a-z0-9-]`), so in
 *  practice this is defence-in-depth against a tampered share URL that
 *  somehow paired an exotic presetId with a colliding registry id. */
function cssAttrValue(s: string): string {
  return s.replace(/["\\\n\r]/g, (ch) => {
    if (ch === '\n') return '\\a ';
    if (ch === '\r') return '\\d ';
    return `\\${ch}`;
  });
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

  const perToken = resolveTokenPresets(c, name);
  // Per-token overrides need addressable spans even with stagger off,
  // so the base `> span` rule is emitted whenever EITHER feature is on
  // — matching TextTarget, which renders spans under the same
  // condition. Without stagger the spans simply share the global
  // timing (no per-letter delay), so a non-overridden token animates
  // exactly as the whole-text version did.
  const staggered = !!c.stagger && c.target === 'text';
  const wantSpanRules =
    c.target === 'text' && (staggered || hasTokenAnimations(c));

  if (wantSpanRules) {
    lines.push(`${ruleSelector} > span {`);
    if (opts.cssVars) {
      // Animation properties don't inherit, so the spans need their
      // own animation longhands. The `--ah-*` variables DO cascade
      // from the parent rule, so we just reference them — and the
      // per-letter `animation-delay` overrides the parent's
      // `var(--ah-delay)` with the staggered offset.
      lines.push(`${indent}animation-name: ${name};`);
      lines.push(`${indent}animation-duration: var(--ah-duration);`);
      lines.push(`${indent}animation-timing-function: var(--ah-easing);`);
      lines.push(
        staggered
          ? `${indent}animation-delay: calc(var(--i) * ${num(c.stagger!.step)}ms);`
          : `${indent}animation-delay: var(--ah-delay);`
      );
      lines.push(`${indent}animation-iteration-count: var(--ah-iterations);`);
      if (c.direction !== 'normal') {
        lines.push(`${indent}animation-direction: ${c.direction};`);
      }
      if (c.fill !== 'none') {
        lines.push(`${indent}animation-fill-mode: ${c.fill};`);
      }
    } else {
      lines.push(`${indent}animation: ${buildAnimationShorthand(c, name)};`);
      if (staggered) {
        lines.push(
          `${indent}animation-delay: calc(var(--i) * ${num(c.stagger!.step)}ms);`
        );
      }
    }
    lines.push(`${indent}display: inline-block;`);
    lines.push('}');
    lines.push('');

    // Per-token override rules. The attribute selector adds
    // specificity over the bare `> span`, so a token carrying
    // `data-anim="<presetId>"` wins. Each rule uses the PRESET's own
    // timing (literal, even in cssVars mode — the `--ah-*` vars hold
    // the GLOBAL timing, which is deliberately not what an override
    // token wants). The staggered per-letter delay is still applied
    // so an overridden token keeps its place in the wave.
    for (const pt of perToken) {
      lines.push(
        `${ruleSelector} > span[data-anim="${cssAttrValue(pt.presetId)}"] {`
      );
      lines.push(
        `${indent}animation: ${buildAnimationShorthand(pt.cfg, pt.kfName)};`
      );
      if (staggered) {
        lines.push(
          `${indent}animation-delay: calc(var(--i) * ${num(c.stagger!.step)}ms);`
        );
      }
      lines.push(`${indent}display: inline-block;`);
      lines.push('}');
      lines.push('');
    }
  }

  lines.push(`@keyframes ${name} {`);
  const body = buildKeyframesBody(c, { indent });
  if (body) lines.push(body);
  lines.push('}');

  // One @keyframes per distinct per-token preset, built from that
  // preset's own keyframes so the token animates independently.
  for (const pt of perToken) {
    lines.push('');
    lines.push(`@keyframes ${pt.kfName} {`);
    const tokBody = buildKeyframesBody(pt.cfg, { indent });
    if (tokBody) lines.push(tokBody);
    lines.push('}');
  }

  return lines.join('\n');
}
