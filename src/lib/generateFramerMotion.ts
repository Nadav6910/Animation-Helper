import type { AnimationConfig, Keyframe, Transform } from '@/types/animation';
import { easingToCss } from './easings';

const num = (n: number) =>
  Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString();

type ChannelKey =
  | 'x'
  | 'y'
  | 'rotateX'
  | 'rotateY'
  | 'skewX'
  | 'skewY'
  | 'scaleX'
  | 'scaleY'
  | 'opacity'
  | 'color'
  | 'backgroundColor'
  | 'filter';

function readChannel(k: Keyframe, ch: ChannelKey): string | number | undefined {
  const t: Transform | undefined = k.transform;
  switch (ch) {
    case 'x':
      return t?.translate?.[0];
    case 'y':
      return t?.translate?.[1];
    case 'rotateX':
      return t?.rotate?.[0];
    case 'rotateY':
      return t?.rotate?.[1];
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
    case 'color':
      return k.color;
    case 'backgroundColor':
      return k.bg;
    case 'filter': {
      const parts: string[] = [];
      if (typeof k.blur === 'number' && k.blur > 0)
        parts.push(`blur(${num(k.blur)}px)`);
      if (typeof k.hueRotate === 'number' && k.hueRotate !== 0)
        parts.push(`hue-rotate(${num(k.hueRotate)}deg)`);
      if (k.dropShadow) parts.push(`drop-shadow(${k.dropShadow})`);
      return parts.length ? parts.join(' ') : undefined;
    }
  }
}

function fmtValue(v: string | number): string {
  return typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : num(v);
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
    'rotateX',
    'rotateY',
    'skewX',
    'skewY',
    'scaleX',
    'scaleY',
    'opacity',
    'color',
    'backgroundColor',
    'filter',
  ];

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
        arr.push(arr.length ? arr[arr.length - 1] : 0);
      }
    }
    if (any) animate[ch] = arr;
  }

  const times = sorted.map((k) => +(k.at / 100).toFixed(4));
  const durSec = c.duration / 1000;
  const easing = easingToCss(c.easing);
  const easingArr = `Array(${Math.max(times.length - 1, 1)}).fill('${easing}')`;

  const animateLines = Object.entries(animate).map(
    ([k, arr]) =>
      `        ${k}: [${arr.map(fmtValue).join(', ')}],`
  );

  const transitionLines = [
    `        duration: ${num(durSec)},`,
    `        delay: ${num(c.delay / 1000)},`,
    `        repeat: ${c.iterations === 'infinite' ? 'Infinity' : `${num(typeof c.iterations === 'number' ? c.iterations - 1 : 0)}`},`,
    `        repeatType: '${
      c.direction === 'alternate' || c.direction === 'alternate-reverse'
        ? 'reverse'
        : 'loop'
    }',`,
    `        ease: ${easingArr},`,
    `        times: [${times.join(', ')}],`,
  ];

  const note =
    sorted.length > 2
      ? `// Note: per-segment easings are approximated with a uniform ease.\n`
      : '';

  return `${note}import { motion } from 'framer-motion';

export function ${name}() {
  return (
    <motion.div
      animate={{
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
