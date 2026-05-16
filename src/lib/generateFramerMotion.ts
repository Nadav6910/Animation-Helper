import type { AnimationConfig, Easing, Keyframe, Transform } from '@/types/animation';
import { easingToCss } from './easings';
import { sanitisePathD } from './svgPathSafety';
import { cssValueSafe, firstColorStop, GRADIENT_RE, num } from './css-helpers';
import { hasTokenAnimations, tokenize, tokenizeModeOf } from './tokenize';

type ChannelKey =
  | 'x'
  | 'y'
  | 'z'
  | 'rotateX'
  | 'rotateY'
  | 'rotateZ'
  | 'skewX'
  | 'skewY'
  | 'scaleX'
  | 'scaleY'
  | 'opacity'
  | 'color'
  | 'backgroundColor'
  | 'background'
  | 'filter'
  | 'offsetDistance'
  | 'clipPath';

function readChannel(k: Keyframe, ch: ChannelKey): string | number | undefined {
  const t: Transform | undefined = k.transform;
  switch (ch) {
    case 'x':
      return t?.translate?.[0];
    case 'y':
      return t?.translate?.[1];
    case 'z':
      return t?.translateZ;
    case 'rotateX':
      return t?.rotate?.[0];
    case 'rotateY':
      return t?.rotate?.[1];
    case 'rotateZ': {
      // Framer Motion has discrete rotateX / rotateY / rotateZ
      // channels, but our internal model splits rotation across
      // `rotate: [x, y]` (the in-plane rotateX / rotateY) and
      // `rotate3d: {x, y, z, deg}` for free-axis rotation. The Z
      // component is only meaningful when the rotate3d axis is the
      // canonical Z unit vector (x=0, y=0, z=1) — that's the case
      // every preset in the library uses. Any other axis (mixed-
      // axis rotate3d) is intentionally ignored here; users who
      // need a fancy mixed rotation in Framer Motion can compose
      // rotateX / rotateY / rotateZ themselves.
      const r = t?.rotate3d;
      if (!r) return undefined;
      const isCanonicalZ = r.x === 0 && r.y === 0 && r.z !== 0;
      return isCanonicalZ ? r.deg : undefined;
    }
    case 'skewX':
      return t?.skew?.[0];
    case 'skewY':
      return t?.skew?.[1];
    case 'scaleX':
      return t?.scale?.[0];
    case 'scaleY':
      return t?.scale?.[1];
    case 'opacity':
      return k.opacity;
    case 'color': {
      if (!k.color) return undefined;
      // Defensive: Framer's `color` channel ultimately serialises into
      // CSS in the consumer's app. Strip declaration-breakout chars so
      // a tampered share URL can't inject rules at the consumer's
      // host site. Same rationale as the other generators.
      const safe = cssValueSafe(k.color);
      // Gradient text-fill needs background-clip + transparent color, which
      // is a static style rather than an animatable channel — fall back to
      // the gradient's first stop so Framer Motion's color interpolation
      // still produces a meaningful tween.
      if (GRADIENT_RE.test(safe)) {
        const stop = firstColorStop(safe);
        return stop === 'inherit' ? undefined : stop;
      }
      return safe;
    }
    case 'backgroundColor': {
      if (!k.bg) return undefined;
      const safe = cssValueSafe(k.bg);
      return safe && !GRADIENT_RE.test(safe) ? safe : undefined;
    }
    case 'background': {
      if (!k.bg) return undefined;
      const safe = cssValueSafe(k.bg);
      return safe && GRADIENT_RE.test(safe) ? safe : undefined;
    }
    case 'filter': {
      const parts: string[] = [];
      if (typeof k.blur === 'number' && k.blur > 0)
        parts.push(`blur(${num(k.blur)}px)`);
      if (typeof k.hueRotate === 'number' && k.hueRotate !== 0)
        parts.push(`hue-rotate(${num(k.hueRotate)}deg)`);
      if (k.dropShadow) parts.push(`drop-shadow(${cssValueSafe(k.dropShadow)})`);
      return parts.length ? parts.join(' ') : undefined;
    }
    case 'offsetDistance':
      return typeof k.offsetDistance === 'number'
        ? `${num(k.offsetDistance)}%`
        : undefined;
    case 'clipPath':
      // Framer Motion forwards CSS values verbatim through its
      // `clipPath` channel and interpolates between adjacent
      // keyframes using the standard CSS clip-path interpolation
      // rules (smooth between same-shape-function values, hard cut
      // otherwise). Sanitise the same way every other untrusted CSS
      // value is — the field is writable from URL hash / paste /
      // localStorage so we can't trust the raw input.
      return k.clipPath ? cssValueSafe(k.clipPath) : undefined;
  }
}

function fmtValue(v: string | number): string {
  return typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : num(v);
}

function easeToken(e: Easing): string {
  if (e.kind === 'cubic') {
    const [a, b, c, d] = e.v;
    return `[${num(a)}, ${num(b)}, ${num(c)}, ${num(d)}]`;
  }
  if (e.kind === 'steps') {
    return `'${easingToCss(e)}'`;
  }
  return `'${e.value}'`;
}

export type GenerateFramerMotionOptions = {
  componentName?: string;
};

export function generateFramerMotion(
  c: AnimationConfig,
  opts: GenerateFramerMotionOptions = {}
): string {
  const name = opts.componentName ?? 'AnimatedBox';
  const sorted = [...c.keyframes].sort((a, b) => a.at - b.at);

  const channels: ChannelKey[] = [
    'x',
    'y',
    'z',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skewX',
    'skewY',
    'scaleX',
    'scaleY',
    'opacity',
    'color',
    'backgroundColor',
    'background',
    'filter',
    'offsetDistance',
    'clipPath',
  ];

  // Resting value for each channel — used to back-fill when a keyframe
  // doesn't define the channel and we have no prior frame to inherit
  // from. scaleX/scaleY/opacity rest at 1; string channels rest as
  // `'none'` so Framer Motion's tween infrastructure doesn't end up
  // with a mixed-type array (`[0, 'polygon(...)'])` — numeric back-
  // fill for a string channel would either no-op or throw at runtime.
  // All numeric channels rest at 0 (no-op).
  const STRING_CHANNELS: ReadonlySet<ChannelKey> = new Set<ChannelKey>([
    'color',
    'backgroundColor',
    'background',
    'filter',
    'offsetDistance',
    'clipPath',
  ]);
  const restingValue = (ch: ChannelKey): string | number => {
    if (ch === 'scaleX' || ch === 'scaleY' || ch === 'opacity') return 1;
    if (STRING_CHANNELS.has(ch)) return 'none';
    return 0;
  };

  const animate: Record<string, (string | number)[]> = {};
  for (const ch of channels) {
    let any = false;
    const arr: (string | number)[] = [];
    for (const k of sorted) {
      const v = readChannel(k, ch);
      if (v !== undefined) {
        any = true;
        arr.push(v);
      } else {
        arr.push(arr.length ? arr[arr.length - 1] : restingValue(ch));
      }
    }
    if (any) animate[ch] = arr;
  }

  const times = sorted.map((k) => +(k.at / 100).toFixed(4));
  const durSec = c.duration / 1000;

  const segCount = Math.max(times.length - 1, 1);
  const segmentEases: string[] = [];
  for (let i = 0; i < segCount; i++) {
    const seg = sorted[i + 1]?.easing ?? sorted[i]?.easing ?? c.easing;
    segmentEases.push(easeToken(seg));
  }
  const easingArr = `[${segmentEases.join(', ')}]`;

  // Framer Motion has no direct equivalent of CSS `direction: reverse` /
  // `alternate-reverse`. Both play the animation back-to-front. Translate
  // by reversing each value array — `times` stay the same — so the
  // tween starts at the original end and ends at the original start.
  // alternate becomes Motion's `repeatType: 'reverse'`; alternate-reverse
  // is the reversed-array form of that.
  if (c.direction === 'reverse' || c.direction === 'alternate-reverse') {
    for (const k of Object.keys(animate)) {
      animate[k] = [...animate[k]].reverse();
    }
  }
  const repeatType =
    c.direction === 'alternate' || c.direction === 'alternate-reverse'
      ? 'reverse'
      : 'loop';

  const animateLines = Object.entries(animate).map(
    ([k, arr]) =>
      `        ${k}: [${arr.map(fmtValue).join(', ')}],`
  );

  const transitionLines = [
    `        duration: ${num(durSec)},`,
    `        delay: ${num(c.delay / 1000)},`,
    `        repeat: ${c.iterations === 'infinite' ? 'Infinity' : `${num(typeof c.iterations === 'number' ? c.iterations - 1 : 0)}`},`,
    `        repeatType: '${repeatType}',`,
    `        ease: ${easingArr},`,
    `        times: [${times.join(', ')}],`,
  ];

  const offsetStyle = c.offsetPath
    ? `      style={{ offsetPath: "path('${sanitisePathD(c.offsetPath.d)}')"${
        c.offsetPath.rotate !== undefined
          ? `, offsetRotate: '${
              typeof c.offsetPath.rotate === 'number'
                ? `${num(c.offsetPath.rotate)}deg`
                : c.offsetPath.rotate
            }'`
          : ''
      } }}\n`
    : '';

  if (c.target === 'svg') {
    const hasDashoffset = sorted.some(
      (k) => typeof k.strokeDashoffset === 'number',
    );
    const dashOffsetLine = hasDashoffset
      ? `        strokeDashoffset: [${sorted
          .map((k) => num(k.strokeDashoffset ?? 100))
          .join(', ')}],`
      : '';
    const animateBody = [...animateLines, dashOffsetLine].filter(Boolean);
    return `import { motion } from 'framer-motion';

// pathLength={100} + strokeDasharray={100} normalise the path so
// strokeDashoffset 100 → 0 maps to "invisible → fully drawn".
export function ${name}() {
  return (
    <motion.svg viewBox="0 0 24 24" className="h-40 w-40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <motion.path
        d="M5 12.5 L10 17.5 L19 7"
        pathLength={100}
        strokeDasharray={100}
        animate={{
${animateBody.join('\n')}
        }}
        transition={{
${transitionLines.join('\n')}
        }}
      />
    </motion.svg>
  );
}
`;
  }

  if (c.target === 'text' && (c.stagger || hasTokenAnimations(c))) {
    // Per-letter stagger: split the text into motion.spans and offset each
    // child's transition delay by `i * step`. The shared transition is
    // declared once and we override `delay` per child.
    // Tokenize the SAME way TextTarget / generateCss / generateHtml do
    // (config's letter|word mode) so the spans line up with the rest of
    // the app instead of always splitting per code-point.
    const tokens = tokenize(c.text || 'Animate', tokenizeModeOf(c));
    const stepMs = c.stagger ? num(c.stagger.step) : 0;
    // Framer Motion drives state from a single variant object, so N
    // independent per-token keyframe sets can't be expressed without
    // emitting N separate components. When per-token overrides exist
    // we still render the spans with the GLOBAL animation and point
    // the user at the CSS export, which carries the real per-token
    // `@keyframes` + `data-anim` selectors. Same format-limitation
    // honesty as the Tailwind / Lottie outputs.
    const perTokenNote = hasTokenAnimations(c)
      ? `// NOTE: this animation has per-token overrides. Framer Motion's
// single-variant model can't drive each token independently — every
// span below uses the global animation. Copy the CSS export for the
// full per-token output (one @keyframes + selector per preset).
`
      : '';
    return `${perTokenNote}import { motion } from 'framer-motion';

const TOKENS = ${JSON.stringify(tokens)};

export function ${name}() {
  return (
    <p style={{ display: 'inline-flex' }}>
      {TOKENS.map((tok, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          animate={{
${animateLines.join('\n')}
          }}
          transition={{
${transitionLines.join('\n')}
            delay: ${num(c.delay / 1000)} + (i * ${stepMs}) / 1000,
          }}
        >
          {tok}
        </motion.span>
      ))}
    </p>
  );
}
`;
  }

  return `import { motion } from 'framer-motion';

export function ${name}() {
  return (
    <motion.div
${offsetStyle}      animate={{
${animateLines.join('\n')}
      }}
      transition={{
${transitionLines.join('\n')}
      }}
    />
  );
}
`;
}
