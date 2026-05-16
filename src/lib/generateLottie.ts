import type { AnimationConfig, Easing, Keyframe, Vec2 } from '@/types/animation';

/**
 * Translate the canonical AnimationConfig into a minimal Bodymovin /
 * Lottie JSON. Coverage is intentionally conservative: translate, scale,
 * rotate (Z axis), opacity. We document everything that doesn't survive
 * the round-trip in a `cm` (comment) field so the consumer knows what
 * was dropped — Lottie players ignore `cm`.
 *
 * Out of scope (silently skipped, listed in `cm`):
 *  - filters (blur / hue-rotate / drop-shadow)
 *  - gradients (Lottie supports them but only via a separate fill type)
 *  - offset-path
 *  - per-keyframe stagger (Lottie has its own mechanism via splitting
 *    text into characters; we'd need a separate text generator)
 *  - steps / spring easing (we serialise as the underlying cubic)
 *  - rotate3d / perspective
 *
 * See https://lottiefiles.github.io/lottie-docs/ for the schema.
 */

const FRAMERATE = 60;

/** Default Lottie composition size in user units. The shape sits at
 *  the centre and translate keyframes offset relative to it; AE-
 *  imported scenes inherit this composition size unless the consumer
 *  overrides the canvas. */
const COMPOSITION_CENTER: [number, number] = [256, 256];

/** Brand accent (RGB 124,92,255 = `#7c5cff`) as a Lottie 0..1 tuple
 *  with alpha. Mirrored in `generateAnimatedSvg` so the two visual
 *  exports look identical out of the box. Pulled to a module-level
 *  constant to make the brand colour single-source — bumping the
 *  accent in tokens means updating one place per generator. */
const ACCENT_LOTTIE: [number, number, number, number] = [
  0.486,
  0.36,
  1,
  1,
];

type LottieKeyframe = {
  t: number; // frame
  s: number[]; // value at this frame
  i?: { x: number[]; y: number[] }; // ease in
  o?: { x: number[]; y: number[] }; // ease out
  h?: number; // hold (no interpolation)
};

const msToFrames = (ms: number, fps = FRAMERATE): number =>
  Math.round((ms / 1000) * fps);

// ---- Easing → cubic bezier coefficients --------------------------------

const PRESET_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

function easingToBezier(e: Easing): [number, number, number, number] {
  if (e.kind === 'cubic') return e.v;
  if (e.kind === 'preset') return PRESET_BEZIER[e.value] ?? PRESET_BEZIER.ease;
  // Steps don't have a smooth bezier equivalent — Lottie's `h:1` (hold)
  // is the closest match. Caller deals with the special case via the
  // `easingHold()` predicate below.
  return PRESET_BEZIER.linear;
}

const easingHold = (e: Easing): boolean => e.kind === 'steps';

// ---- Keyframe → Lottie keyframe array ----------------------------------

function buildLottieKeyframes(
  sorted: Keyframe[],
  duration: number,
  fps: number,
  fallbackEasing: Easing,
  read: (k: Keyframe) => number[] | null
): LottieKeyframe[] {
  const frames: LottieKeyframe[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const k = sorted[i];
    const value = read(k);
    if (value === null) continue;
    const t = msToFrames((k.at / 100) * duration, fps);
    // Lottie's `i` (in tangent) and `o` (out tangent) on a keyframe
    // describe the curve LEAVING this keyframe toward the next — so
    // segment i→i+1 takes its easing from sorted[i], not sorted[i+1].
    // The previous code looked one ahead and shifted every easing by
    // a frame, which made the first segment use the fallback and the
    // last segment use a value never reached.
    const easing = k.easing ?? fallbackEasing;
    const [x1, y1, x2, y2] = easingToBezier(easing);
    // Bodymovin convention for the bezier handles:
    //   o = the OUT tangent of THIS keyframe = the curve's first
    //       control point relative to (0,0)–(1,1) progress space
    //       → uses (x1, y1) directly.
    //   i = the IN tangent of the NEXT keyframe = the curve's
    //       second control point, mirrored about (1, 1) so it's
    //       expressed as an offset from the destination
    //       → uses (1 - x2, 1 - y2).
    // Without the mirror the curve looks subtly inverted on import.
    const frame: LottieKeyframe = {
      t,
      s: value,
      o: { x: [x1], y: [y1] },
      i: { x: [1 - x2], y: [1 - y2] },
    };
    if (easingHold(easing)) frame.h = 1;
    frames.push(frame);
  }
  return frames;
}

// ---- Channel readers ---------------------------------------------------

const readPosition = (k: Keyframe, base: Vec2 = COMPOSITION_CENTER): number[] | null => {
  const t = k.transform?.translate;
  if (!t) return null;
  return [base[0] + t[0], base[1] + t[1]];
};
const readScale = (k: Keyframe): number[] | null => {
  const s = k.transform?.scale;
  if (!s) return null;
  return [s[0] * 100, s[1] * 100, 100];
};
const readRotation = (k: Keyframe): number[] | null => {
  // Lottie 2D rotation is a single Z-axis number — there's no 3D
  // rotation primitive in the basic shape layer. We collapse rotateX
  // and rotateY into a Z-equivalent (best-effort visual match for a
  // 2D player), favouring whichever axis the user actually animated.
  // The `cm` notice in `generateLottie` warns that this is not a true
  // 3D rotation, so playback in After Effects / lottie-web will look
  // 2D regardless of what the WAAPI preview shows.
  const r = k.transform?.rotate;
  if (!r) return null;
  // Pick the non-zero axis; if both are non-zero, sum them (lossy but
  // closer to the perceptual amount than picking one).
  const rx = r[0] || 0;
  const ry = r[1] || 0;
  if (rx === 0 && ry === 0) return [0];
  if (rx === 0) return [ry];
  if (ry === 0) return [rx];
  return [rx + ry];
};
const readOpacity = (k: Keyframe): number[] | null => {
  if (typeof k.opacity !== 'number') return null;
  return [Math.round(k.opacity * 100)];
};

// ---- Top-level shape factory -------------------------------------------

function shapeLayer(c: AnimationConfig, durationFrames: number, fps: number) {
  const sorted = [...c.keyframes].sort((a, b) => a.at - b.at);

  const positionFrames = buildLottieKeyframes(
    sorted,
    c.duration,
    fps,
    c.easing,
    (k) => readPosition(k)
  );
  const scaleFrames = buildLottieKeyframes(
    sorted,
    c.duration,
    fps,
    c.easing,
    readScale
  );
  const rotationFrames = buildLottieKeyframes(
    sorted,
    c.duration,
    fps,
    c.easing,
    readRotation
  );
  const opacityFrames = buildLottieKeyframes(
    sorted,
    c.duration,
    fps,
    c.easing,
    readOpacity
  );

  // For each property: if there's > 1 keyframe, emit `a:1, k:[...]` (animated);
  // otherwise emit `a:0, k:value` (static at the first / default value).
  const animOrStatic = (frames: LottieKeyframe[], staticValue: number[]) => {
    if (frames.length >= 2) return { a: 1, k: frames };
    return { a: 0, k: frames[0]?.s ?? staticValue };
  };

  return {
    ddd: 0,
    ind: 1,
    ty: 4, // shape layer
    nm: 'animated',
    sr: 1,
    ks: {
      o: animOrStatic(opacityFrames, [100]),
      r: animOrStatic(rotationFrames, [0]),
      p: animOrStatic(positionFrames, COMPOSITION_CENTER),
      a: { a: 0, k: [0, 0, 0] },
      s: animOrStatic(scaleFrames, [100, 100, 100]),
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          // A simple 100×100 rectangle as the shape — consumer can swap
          // for their own asset; the keyframe animation is portable.
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [100, 100] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 12 },
            nm: 'Rect',
          },
          {
            ty: 'fl',
            c: { a: 0, k: ACCENT_LOTTIE }, // accent purple — see top of file
            o: { a: 0, k: 100 },
            nm: 'Fill',
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
        nm: 'Group',
      },
    ],
    ip: 0, // in-point frame
    op: durationFrames, // out-point frame
    st: 0,
    bm: 0,
  };
}

// ---- Public ------------------------------------------------------------

export type GenerateLottieOptions = {
  width?: number;
  height?: number;
  fps?: number;
};

export function generateLottie(
  c: AnimationConfig,
  opts: GenerateLottieOptions = {}
): string {
  const w = opts.width ?? 512;
  const h = opts.height ?? 512;
  const fps = opts.fps ?? FRAMERATE;
  const durationFrames = msToFrames(c.duration, fps);

  const dropped: string[] = [];
  if (c.keyframes.some((k) => typeof k.blur === 'number' && k.blur > 0))
    dropped.push('blur');
  if (c.keyframes.some((k) => typeof k.hueRotate === 'number' && k.hueRotate))
    dropped.push('hue-rotate');
  if (c.keyframes.some((k) => k.dropShadow)) dropped.push('drop-shadow');
  if (c.keyframes.some((k) => k.color)) dropped.push('color animation');
  if (c.keyframes.some((k) => k.bg)) dropped.push('background animation');
  if (c.offsetPath) dropped.push('offset-path');
  if (c.stagger) dropped.push('per-letter stagger');
  if (c.target === 'text' && c.tokenAnimations?.length)
    dropped.push(
      'per-token animations (each token would need its own Lottie layer — rebuild per-character in After Effects)'
    );
  if (c.target === 'text') dropped.push('text rendering (use a Lottie text layer in After Effects to add it back)');
  if (c.target === 'svg') dropped.push('SVG path geometry (replace the rect shape with your <path>)');
  if (c.keyframes.some((k) => k.easing?.kind === 'steps'))
    dropped.push('steps() easing (serialised as a hold keyframe)');
  // Flag 3D rotation collapse — the WAAPI preview spins around X/Y
  // axes, but the basic Lottie shape layer only carries a single Z
  // rotation, so we render the spin as Z-only (sum of axes). Users
  // expecting a perspective-style flip in lottie-web will see flat
  // rotation and should switch to a 3D-capable layer.
  if (c.keyframes.some((k) => k.transform?.rotate3d?.deg))
    dropped.push('rotate3d (collapsed to Z-rotation)');
  // Lottie's basic shape layer has no animatable clip-path / mask
  // primitive. Authoring tools (After Effects, Lottielab) can build
  // animated masks but the resulting schema is wildly different from
  // our keyframe model — emit a heads-up rather than half-fake it.
  if (c.keyframes.some((k) => k.clipPath)) dropped.push('clip-path animation');
  if (
    c.keyframes.some(
      (k) => (k.transform?.rotate?.[0] ?? 0) !== 0 ||
        (k.transform?.rotate?.[1] ?? 0) !== 0
    ) &&
    c.keyframes.some(
      (k) => (k.transform?.rotate?.[0] ?? 0) !== 0
    ) &&
    c.keyframes.some(
      (k) => (k.transform?.rotate?.[1] ?? 0) !== 0
    )
  ) {
    dropped.push('rotateX / rotateY (collapsed to Z-rotation)');
  }

  const cm = dropped.length
    ? `Lottie subset — translate / rotate-Z / scale / opacity supported. Dropped: ${dropped.join(', ')}.`
    : 'Lottie subset — translate / rotate-Z / scale / opacity supported.';

  const lottie = {
    v: '5.7.4', // schema version
    fr: fps,
    ip: 0,
    op: durationFrames,
    w,
    h,
    nm: 'Animation Helper export',
    ddd: 0,
    cm,
    assets: [],
    layers: [shapeLayer(c, durationFrames, fps)],
    markers: [],
  };

  return JSON.stringify(lottie, null, 2);
}
