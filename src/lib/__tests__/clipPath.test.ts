import { describe, expect, it } from 'vitest';
import {
  clipPathToPoints,
  defaultPolygon,
  insertPointAt,
  pointsToClipPath,
} from '@/lib/clipPath';

describe('pointsToClipPath', () => {
  it('serialises a 4-point square', () => {
    expect(
      pointsToClipPath([
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ])
    ).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)');
  });

  it('round-trips decimals to 3 places without float crud', () => {
    // 0.4 in JS float is 0.4000000000000001 after some ops.
    const noisy = 0.1 + 0.2 + 0.1; // 0.4000000000000001
    expect(pointsToClipPath([[noisy, 50], [100, 50], [50, 100]])).toBe(
      'polygon(0.4% 50%, 100% 50%, 50% 100%)'
    );
  });

  it('normalises -0 away', () => {
    expect(pointsToClipPath([[-0, 50], [100, 50], [50, 100]])).toBe(
      'polygon(0% 50%, 100% 50%, 50% 100%)'
    );
  });

  it('emits `polygon()` for fewer than 3 points (degenerate)', () => {
    expect(pointsToClipPath([])).toBe('polygon()');
    expect(pointsToClipPath([[0, 0], [100, 0]])).toBe('polygon()');
  });
});

describe('clipPathToPoints', () => {
  it('parses a canonical square', () => {
    expect(
      clipPathToPoints('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)')
    ).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
  });

  it('tolerates wide whitespace', () => {
    expect(
      clipPathToPoints('polygon(  0% 0% , 100% 0%,100%   100% , 0% 100%  )')
    ).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
  });

  it('accepts decimal points', () => {
    expect(clipPathToPoints('polygon(.5% 25%, 50% 50%, 50% 100%)')).toEqual([
      [0.5, 25],
      [50, 50],
      [50, 100],
    ]);
  });

  it('rejects non-polygon clip-path functions', () => {
    expect(clipPathToPoints('circle(50% at 50% 50%)')).toBeNull();
    expect(clipPathToPoints('inset(10% 20%)')).toBeNull();
    expect(clipPathToPoints('path("M0,0 L1,1")')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(clipPathToPoints('polygon(0%, 100% 0%, 100% 100%)')).toBeNull();
    expect(clipPathToPoints('polygon(0 0, 100 0, 100 100)')).toBeNull();
    expect(clipPathToPoints('polygon()')).toBeNull();
    expect(clipPathToPoints('')).toBeNull();
    expect(clipPathToPoints('polygon(1e-1% 0%, 100% 0%, 50% 100%)')).toBeNull();
  });

  it('rejects degenerate polygons (< 3 points)', () => {
    expect(clipPathToPoints('polygon(0% 0%, 100% 100%)')).toBeNull();
  });

  it('round-trips through pointsToClipPath', () => {
    const points = [
      [10, 20],
      [80, 30],
      [50, 90],
    ] as const;
    const serialized = pointsToClipPath(points);
    expect(clipPathToPoints(serialized)).toEqual(points);
  });
});

describe('insertPointAt', () => {
  it('appends to a single point', () => {
    expect(insertPointAt([[0, 0]], [50, 50])).toEqual([[0, 0], [50, 50]]);
  });

  it('inserts on the closest edge of a square', () => {
    const square = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ] as const;
    // Click near the top edge (50, 2) — should insert between [0,0] and [100,0]
    const result = insertPointAt(square, [50, 2]);
    expect(result).toEqual([
      [0, 0],
      [50, 2],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
  });

  it('inserts on the right edge when clicked near it', () => {
    const square = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ] as const;
    const result = insertPointAt(square, [98, 50]);
    expect(result).toEqual([
      [0, 0],
      [100, 0],
      [98, 50],
      [100, 100],
      [0, 100],
    ]);
  });

  it('handles zero-length edges without NaN', () => {
    // Two adjacent vertices at the same coords would make
    // distanceToSegment divide by zero if not guarded. The function
    // falls back to the point-distance from the shared endpoint —
    // tested explicitly so a future refactor can't drop the guard
    // silently.
    const degenerate = [
      [50, 50],
      [50, 50],
      [0, 100],
    ] as const;
    const result = insertPointAt(degenerate, [10, 10]);
    // Click is closer to (0, 100) → (50, 50) edge than to either of
    // the zero-length pairs. Result is finite and correctly placed.
    expect(result).toHaveLength(4);
    expect(result.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)))
      .toBe(true);
  });

  it('considers the wrap-around edge (last → first)', () => {
    const square = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ] as const;
    // Click near the left edge — that's the segment from the last
    // vertex back to the first.
    const result = insertPointAt(square, [2, 50]);
    expect(result).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
      [2, 50],
    ]);
  });
});

describe('defaultPolygon', () => {
  it('returns a 4-point square covering the full box', () => {
    expect(defaultPolygon()).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
  });

  it('returns a fresh array each call (no shared mutable state)', () => {
    const a = defaultPolygon();
    a[0] = [1, 1];
    const b = defaultPolygon();
    expect(b[0]).toEqual([0, 0]);
  });
});
