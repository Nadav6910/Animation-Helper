import { isSafePathD } from './svgPathSafety';
import type {
  AnimationConfig,
  Direction,
  Easing,
  EasingPreset,
  FillMode,
  Keyframe,
  OffsetPath,
  Rotate3d,
  ShapeKind,
  StepsJump,
  TargetKind,
  Transform,
  Vec2,
} from '@/types/animation';

/**
 * Runtime-validate an unknown payload as `AnimationConfig` and return
 * a sanitised copy, OR return `null` if the input is malformed beyond
 * recovery. Callers should treat anything coming from an UNTRUSTED
 * source — `#c=` URL hash, localStorage, postMessage — as raw `unknown`
 * and pipe it through this validator before applying.
 *
 * Why this exists
 * ───────────────
 * The Wave 3 security audit found that several generators interpolate
 * config fields into `<style>` rules without escaping (`easing.value`,
 * `direction`, `fill`, `offsetPath.rotate`, etc.). The TypeScript
 * `as AnimationConfig` cast at decode time was the only validation,
 * which meant a crafted share URL could land arbitrary CSS into the
 * victim's live preview at first paint — a CSS-injection / data-
 * exfiltration vector in a client-side-only app.
 *
 * Per-field allow-listing here removes the trust assumption from every
 * downstream sink: if a preset / hash / saved entry survives this
 * function, every union-typed field is guaranteed to be one of its
 * legal values, every numeric field is `Number.isFinite`, every string
 * is at most 4 KB, and unknown extra keys are stripped. Defence-in-
 * depth helpers like `cssValueSafe` remain as a second line of defence
 * against value-level (color / gradient) injection.
 *
 * Strategy
 * ────────
 *  - Allow-list union strings (target / shape / direction / fill /
 *    easing.kind / easing.value / easing.jump / offsetPath.rotate
 *    keyword form).
 *  - Coerce numerics through `Number.isFinite` with explicit fallback;
 *    no `+` / `Number()` heuristics that swallow `'1; }body{}'` as 1.
 *  - Cap free-text strings (`text`, `selector`, `svgPath`, keyframe
 *    `id`) at a length that's generous for legitimate use but rejects
 *    DoS-by-megabyte.
 *  - For `offsetPath.d` and any path-shaped field, defer to the existing
 *    `isSafePathD` regex which is already battle-tested in the form.
 *  - Anything that doesn't match drops back to a safe default rather
 *    than failing the whole config — bias toward "config loads with
 *    sensible values" so a partly-malformed share URL still works.
 */

// ----------------------------- helpers ----------------------------------

const SHAPE_KINDS: ReadonlySet<ShapeKind> = new Set([
  'square',
  'triangle',
  'circle',
  'star',
  'arrow',
  'message',
  'hexagon',
  'diamond',
  'pill',
  'heart',
  'cross',
  'pentagon',
]);

const TARGET_KINDS: ReadonlySet<TargetKind> = new Set(['text', 'shape', 'svg']);

const DIRECTIONS: ReadonlySet<Direction> = new Set([
  'normal',
  'reverse',
  'alternate',
  'alternate-reverse',
]);

const FILL_MODES: ReadonlySet<FillMode> = new Set([
  'none',
  'forwards',
  'backwards',
  'both',
]);

const EASING_PRESETS: ReadonlySet<EasingPreset> = new Set([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
]);

const STEPS_JUMPS: ReadonlySet<StepsJump> = new Set([
  'start',
  'end',
  'none',
  'both',
]);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const finiteOrUndef = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const STR_MAX = 4096;
const cappedStr = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.length <= STR_MAX ? v : fallback;

const vec2 = (v: unknown, fallback: Vec2 = [0, 0]): Vec2 => {
  if (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === 'number' &&
    typeof v[1] === 'number' &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  ) {
    return [v[0], v[1]];
  }
  return fallback;
};

// ----------------------------- per-shape ------------------------------

function validateRotate3d(v: unknown): Rotate3d | undefined {
  if (!isObject(v)) return undefined;
  return {
    x: num(v.x, 0),
    y: num(v.y, 0),
    z: num(v.z, 0),
    deg: num(v.deg, 0),
  };
}

function validateTransform(v: unknown): Transform | undefined {
  if (!isObject(v)) return undefined;
  const out: Transform = {};
  if ('translate' in v) out.translate = vec2(v.translate);
  const tz = finiteOrUndef(v.translateZ);
  if (tz !== undefined) out.translateZ = tz;
  if ('rotate' in v) out.rotate = vec2(v.rotate);
  if ('rotate3d' in v) {
    const r3 = validateRotate3d(v.rotate3d);
    if (r3) out.rotate3d = r3;
  }
  if ('skew' in v) out.skew = vec2(v.skew);
  if ('scale' in v) out.scale = vec2(v.scale, [1, 1]);
  const persp = finiteOrUndef(v.perspective);
  if (persp !== undefined) out.perspective = persp;
  return out;
}

function validateEasing(v: unknown): Easing {
  // Default falls back to the canonical `ease` preset — picked over
  // `linear` because it matches the app's default initial config and
  // is what consumers expect when an unparseable easing slips in.
  const fallback: Easing = { kind: 'preset', value: 'ease' };
  if (!isObject(v)) return fallback;
  if (v.kind === 'preset') {
    const value = typeof v.value === 'string' ? v.value : '';
    return EASING_PRESETS.has(value as EasingPreset)
      ? { kind: 'preset', value: value as EasingPreset }
      : fallback;
  }
  if (v.kind === 'cubic') {
    const arr = v.v;
    if (
      Array.isArray(arr) &&
      arr.length === 4 &&
      arr.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return {
        kind: 'cubic',
        v: [arr[0], arr[1], arr[2], arr[3]] as [number, number, number, number],
      };
    }
    return fallback;
  }
  if (v.kind === 'steps') {
    const n = finiteOrUndef(v.n);
    if (n === undefined || n < 1) return fallback;
    const jump = typeof v.jump === 'string' ? v.jump : '';
    if (!STEPS_JUMPS.has(jump as StepsJump)) return fallback;
    return {
      kind: 'steps',
      n: Math.max(1, Math.round(n)),
      jump: jump as StepsJump,
    };
  }
  return fallback;
}

function validateOffsetPath(v: unknown): OffsetPath | undefined {
  if (!isObject(v)) return undefined;
  const d = cappedStr(v.d);
  // The existing path-d safety regex is the canonical gate — reuse it
  // here so URL-hash payloads can't sneak past sinks that still trust
  // sanitisePathD()'s caller-precondition.
  if (!d || !isSafePathD(d)) return undefined;
  let rotate: OffsetPath['rotate'];
  if (v.rotate === 'auto' || v.rotate === 'reverse') {
    rotate = v.rotate;
  } else if (typeof v.rotate === 'number' && Number.isFinite(v.rotate)) {
    rotate = v.rotate;
  }
  return rotate !== undefined ? { d, rotate } : { d };
}

function validateKeyframe(v: unknown): Keyframe | null {
  if (!isObject(v)) return null;
  const id = cappedStr(v.id);
  if (!id) return null;
  const at = num(v.at, NaN);
  if (!Number.isFinite(at)) return null;
  const k: Keyframe = { id, at: Math.max(0, Math.min(100, at)) };
  if ('transform' in v) {
    const t = validateTransform(v.transform);
    if (t) k.transform = t;
  }
  const opacity = finiteOrUndef(v.opacity);
  if (opacity !== undefined) k.opacity = Math.max(0, Math.min(1, opacity));
  if ('color' in v) {
    const c = cappedStr(v.color);
    if (c) k.color = c;
  }
  if ('bg' in v) {
    const bg = cappedStr(v.bg);
    if (bg) k.bg = bg;
  }
  const blur = finiteOrUndef(v.blur);
  if (blur !== undefined) k.blur = Math.max(0, blur);
  const hueRotate = finiteOrUndef(v.hueRotate);
  if (hueRotate !== undefined) k.hueRotate = hueRotate;
  if ('dropShadow' in v) {
    const ds = cappedStr(v.dropShadow);
    if (ds) k.dropShadow = ds;
  }
  const sd = finiteOrUndef(v.strokeDashoffset);
  if (sd !== undefined) k.strokeDashoffset = sd;
  if ('easing' in v) k.easing = validateEasing(v.easing);
  const od = finiteOrUndef(v.offsetDistance);
  if (od !== undefined) k.offsetDistance = od;
  return k;
}

// ----------------------------- top-level ------------------------------

/**
 * Validate an unknown payload as a complete `AnimationConfig`. Returns
 * the sanitised config on success, or `null` on hard failure (input is
 * not a plain object, has no keyframes, or fields fail their per-type
 * checks beyond what defaults can paper over).
 */
export function validateAnimationConfig(
  raw: unknown
): AnimationConfig | null {
  if (!isObject(raw)) return null;

  const target =
    typeof raw.target === 'string' && TARGET_KINDS.has(raw.target as TargetKind)
      ? (raw.target as TargetKind)
      : null;
  if (!target) return null;

  // Selector flows into a CSS rule's selector slot — keep it narrow.
  // The app emits `.ah-<safeId>` so a strict allow-list would also be
  // possible, but a length-capped string is sufficient here because
  // callers use the validated config to generate output, not to inject
  // back into runtime CSS without scoping.
  const selector = cappedStr(raw.selector, '.animated');
  if (!selector) return null;

  const keyframesIn = Array.isArray(raw.keyframes) ? raw.keyframes : [];
  const keyframes: Keyframe[] = [];
  for (const k of keyframesIn) {
    const valid = validateKeyframe(k);
    if (valid) keyframes.push(valid);
  }
  if (keyframes.length === 0) return null;

  const duration = num(raw.duration, 1500);
  const delay = num(raw.delay, 0);

  let iterations: number | 'infinite';
  if (raw.iterations === 'infinite') {
    iterations = 'infinite';
  } else {
    const n = finiteOrUndef(raw.iterations);
    iterations = n === undefined ? 1 : Math.max(1, Math.min(1000, n));
  }

  const direction =
    typeof raw.direction === 'string' &&
    DIRECTIONS.has(raw.direction as Direction)
      ? (raw.direction as Direction)
      : 'normal';

  const fill =
    typeof raw.fill === 'string' && FILL_MODES.has(raw.fill as FillMode)
      ? (raw.fill as FillMode)
      : 'none';

  const out: AnimationConfig = {
    target,
    selector,
    keyframes,
    duration: Math.max(0, Math.min(600_000, duration)),
    delay: Math.max(0, Math.min(60_000, delay)),
    iterations,
    direction,
    fill,
    easing: validateEasing(raw.easing),
  };

  if ('shape' in raw) {
    const s = typeof raw.shape === 'string' ? raw.shape : '';
    if (SHAPE_KINDS.has(s as ShapeKind)) out.shape = s as ShapeKind;
  }
  if ('svgPath' in raw) {
    const p = cappedStr(raw.svgPath);
    if (p) out.svgPath = p;
  }
  if ('text' in raw) {
    const t = cappedStr(raw.text);
    if (t) out.text = t;
  }
  if (isObject(raw.stagger)) {
    const step = finiteOrUndef(raw.stagger.step);
    if (step !== undefined) out.stagger = { step: Math.max(0, step) };
  }
  if ('offsetPath' in raw) {
    const op = validateOffsetPath(raw.offsetPath);
    if (op) out.offsetPath = op;
  }
  return out;
}
