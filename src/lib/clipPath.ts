/**
 * Helpers for the polygon clip-path mini-language used by the
 * PolygonEditor and the custom-shapes feature. Points are stored as
 * `[x, y]` in percent units (0 – 100), matching CSS clip-path's
 * `polygon(x% y%, …)` syntax so the format round-trips cleanly between
 * the editor, the store, and the generated CSS.
 */

/** A polygon vertex in % coordinates. */
export type ClipPathPoint = readonly [number, number];

/** Serialise a point list into the CSS `polygon(...)` form. */
export function pointsToClipPath(points: ReadonlyArray<ClipPathPoint>): string {
  if (points.length < 3) return 'polygon()';
  const parts = points.map(([x, y]) => `${trim(x)}% ${trim(y)}%`);
  return `polygon(${parts.join(', ')})`;
}

/**
 * Parse `polygon(x% y%, …)` back into the array form. Returns `null` on
 * anything we don't recognise — the caller is responsible for surfacing
 * an error or falling back to the default shape. Strict on purpose:
 * scientific notation, raw numbers without `%`, and other clip-path
 * functions (`circle()`, `inset()`, `path()`) are all rejected here so
 * unsupported input doesn't silently get coerced into a wrong polygon.
 */
export function clipPathToPoints(input: string): ClipPathPoint[] | null {
  const trimmed = input.trim();
  const m = trimmed.match(/^polygon\s*\(\s*(.+)\s*\)$/i);
  if (!m) return null;
  const body = m[1];
  if (!body.trim()) return null;
  const pairs = body.split(',');
  const out: ClipPathPoint[] = [];
  for (const raw of pairs) {
    const m2 = raw.trim().match(
      /^(-?(?:\d+(?:\.\d+)?|\.\d+))%\s+(-?(?:\d+(?:\.\d+)?|\.\d+))%$/
    );
    if (!m2) return null;
    const x = Number(m2[1]);
    const y = Number(m2[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    out.push([x, y]);
  }
  return out.length >= 3 ? out : null;
}

/**
 * Insert a new point between the two existing points whose edge is
 * closest to the click position. Used when the user taps inside the
 * editor area to add a vertex.
 */
export function insertPointAt(
  points: ReadonlyArray<ClipPathPoint>,
  click: ClipPathPoint
): ClipPathPoint[] {
  if (points.length < 2) return [...points, click];
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const d = distanceToSegment(click, a, b);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  const next = [...points];
  next.splice(bestIdx + 1, 0, click);
  return next;
}

/**
 * Default shape for new custom shapes / fresh keyframe entries — a
 * 4-pt rectangle covering the box. Easiest learning curve and renders
 * as the trivial "no clip" case.
 */
export function defaultPolygon(): ClipPathPoint[] {
  return [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
}

// ---- internal helpers ----------------------------------------------

// 3-decimal trim with `-0` normalisation. Matches BezierEditor's
// round3, so generated CSS doesn't carry float crud like `0.4000…001`.
function trim(n: number): number {
  const r = Math.round(n * 1000) / 1000;
  return r === 0 ? 0 : r;
}

// Minimum distance from point `p` to segment `a—b`. Standard 2D
// projection clamp; used only for the "closest edge" search above.
function distanceToSegment(
  p: ClipPathPoint,
  a: ClipPathPoint,
  b: ClipPathPoint
): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}
