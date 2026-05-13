import type { BuiltInShapeKind, ShapeKind } from '@/types/animation';
import type { CustomShape } from '@/store/customShapesStore';
import { pointsToClipPath, type ClipPathPoint } from './clipPath';

export type ShapeDef = {
  /** Either a BuiltInShapeKind (one of the 12 shipped shapes) or a
   *  `custom:<uid>` ID for a user-authored shape. */
  kind: ShapeKind;
  label: string;
  clipPath: string | null;
  borderRadius?: string;
  /**
   * Crisp 100×100 thumbnail geometry for the picker. `kind: 'rect'` and
   * `'circle'` use plain SVG primitives so rounded square + circle stay sharp;
   * `'path'` uses an `M…Z` path translated from the same proportions as the
   * stage `clipPath`, guaranteeing visual parity.
   */
  preview:
    | { kind: 'rect'; rx: number }
    | { kind: 'circle' }
    | { kind: 'path'; d: string };
  /**
   * Optional Tailwind size override for the stage container. Default is
   * a square `h-32 w-32 sm:h-40 sm:w-40`. Use this when a shape needs a
   * non-square aspect (pill, banner, etc).
   */
  containerClass?: string;
  /**
   * Optional CSS `mask-image` URL. CSS `clip-path: path()` only accepts
   * pixel coordinates, so curved shapes (e.g. heart) can't scale to the
   * element's box from a fixed-size path string. `mask-image` with
   * `mask-size: 100% 100%` stretches the SVG to fill the container, so
   * use this for any shape whose geometry needs to scale.
   */
  maskImage?: string;
};

/** Tiny helper: wrap an SVG path payload as a data URL ready for
 *  `mask-image`. Whitespace / `#` are URI-encoded so Safari accepts it. */
function maskFromPath(d: string, viewBox = '0 0 100 100'): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}' preserveAspectRatio='none'><path d='${d}' fill='black'/></svg>`;
  return `url("data:image/svg+xml;utf8,${svg.replace(/#/g, '%23').replace(/"/g, "'")}")`;
}

export const SHAPES: ShapeDef[] = [
  {
    kind: 'square',
    label: 'Square',
    clipPath: null,
    borderRadius: '12px',
    preview: { kind: 'rect', rx: 12 },
  },
  {
    kind: 'circle',
    label: 'Circle',
    clipPath: null,
    borderRadius: '50%',
    preview: { kind: 'circle' },
  },
  {
    kind: 'triangle',
    label: 'Triangle',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    preview: { kind: 'path', d: 'M50 0 L0 100 L100 100 Z' },
  },
  {
    kind: 'star',
    label: 'Star',
    clipPath:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    preview: {
      kind: 'path',
      d: 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z',
    },
  },
  {
    kind: 'arrow',
    label: 'Arrow',
    clipPath:
      'polygon(0% 35%, 60% 35%, 60% 15%, 100% 50%, 60% 85%, 60% 65%, 0% 65%)',
    preview: {
      kind: 'path',
      d: 'M0 35 L60 35 L60 15 L100 50 L60 85 L60 65 L0 65 Z',
    },
  },
  {
    kind: 'message',
    label: 'Message',
    clipPath:
      'polygon(0 0, 100% 0, 100% 75%, 75% 75%, 65% 100%, 60% 75%, 0 75%)',
    preview: {
      kind: 'path',
      d: 'M0 0 L100 0 L100 75 L75 75 L65 100 L60 75 L0 75 Z',
    },
  },
  {
    kind: 'hexagon',
    label: 'Hexagon',
    clipPath:
      'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    preview: {
      kind: 'path',
      d: 'M25 0 L75 0 L100 50 L75 100 L25 100 L0 50 Z',
    },
  },
  {
    kind: 'diamond',
    label: 'Diamond',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    preview: {
      kind: 'path',
      d: 'M50 0 L100 50 L50 100 L0 50 Z',
    },
  },
  {
    kind: 'pill',
    label: 'Pill',
    clipPath: null,
    borderRadius: '9999px',
    // 2:1 aspect — a fully-rounded square is just a circle. The picker
    // tile is square (matching its grid cell) so its `rect` thumbnail
    // shows the rounded ends as a flatter pill shape via `rx: 50`.
    containerClass: 'h-16 w-32 sm:h-20 sm:w-44',
    preview: { kind: 'rect', rx: 50 },
  },
  {
    kind: 'heart',
    label: 'Heart',
    // CSS clip-path: path() is pixel-based and won't scale to fill a
    // 128px / 160px element from a 100×100 path string. Use mask-image
    // with mask-size: 100% 100% so the heart stretches to the full
    // container, perfectly centred.
    clipPath: null,
    maskImage: maskFromPath(
      'M50 90 C 18 70, 0 45, 14 24 C 26 6, 44 8, 50 26 C 56 8, 74 6, 86 24 C 100 45, 82 70, 50 90 Z'
    ),
    preview: {
      kind: 'path',
      d: 'M50 90 C 18 70, 0 45, 14 24 C 26 6, 44 8, 50 26 C 56 8, 74 6, 86 24 C 100 45, 82 70, 50 90 Z',
    },
  },
  {
    kind: 'cross',
    label: 'Cross',
    clipPath:
      'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
    preview: {
      kind: 'path',
      d: 'M35 0 L65 0 L65 35 L100 35 L100 65 L65 65 L65 100 L35 100 L35 65 L0 65 L0 35 L35 35 Z',
    },
  },
  {
    kind: 'pentagon',
    label: 'Pentagon',
    clipPath:
      'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    preview: {
      kind: 'path',
      d: 'M50 0 L100 38 L82 100 L18 100 L0 38 Z',
    },
  },
];

export const SHAPE_BY_KIND: Record<BuiltInShapeKind, ShapeDef> = Object.fromEntries(
  SHAPES.map((s) => [s.kind, s])
) as Record<BuiltInShapeKind, ShapeDef>;

/**
 * Convert a stored `CustomShape` into the runtime `ShapeDef` form so
 * renderers can treat it interchangeably with built-ins. Generates an
 * SVG path for the picker thumbnail from the same polygon vertices
 * that drive the clip-path, guaranteeing visual parity between the
 * thumbnail and the rendered stage shape.
 */
export function customShapeToDef(custom: CustomShape): ShapeDef {
  return {
    kind: custom.id,
    label: custom.name,
    clipPath: pointsToClipPath(custom.points),
    preview: { kind: 'path', d: pointsToSvgPath(custom.points) },
  };
}

function pointsToSvgPath(points: ReadonlyArray<ClipPathPoint>): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const parts = [`M${first[0]} ${first[1]}`];
  for (const [x, y] of rest) parts.push(`L${x} ${y}`);
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Look up the ShapeDef for any `ShapeKind`, regardless of whether
 * it's a built-in or a custom user shape. Returns `undefined` if the
 * id no longer exists (e.g. a config references a custom shape the
 * user has since deleted) — caller falls back to a sensible default
 * (`SHAPE_BY_KIND.square`).
 */
export function resolveShapeDef(
  kind: ShapeKind | undefined,
  customShapes: ReadonlyArray<CustomShape> = []
): ShapeDef | undefined {
  if (!kind) return undefined;
  if (kind.startsWith('custom:')) {
    const custom = customShapes.find((s) => s.id === kind);
    return custom ? customShapeToDef(custom) : undefined;
  }
  // After the prefix check, `kind` is guaranteed to be a
  // BuiltInShapeKind at runtime — the lookup may still miss if a
  // stale id slipped in, in which case the caller's fallback applies.
  return SHAPE_BY_KIND[kind as BuiltInShapeKind];
}
