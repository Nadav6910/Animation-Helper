import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  customShapeToDef,
  resolveShapeDef,
  SHAPE_BY_KIND,
} from '@/lib/shapes';
import { useCustomShapesStore } from '@/store/customShapesStore';
import type { CustomShape, CustomShapeId } from '@/types/animation';

const STORAGE_KEY = 'ah:custom-shapes';

function makeShape(overrides: Partial<CustomShape> = {}): CustomShape {
  return {
    id: 'custom:fixture' as CustomShapeId,
    name: 'Fixture',
    createdAt: 0,
    points: [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ],
    ...overrides,
  };
}

describe('customShapeToDef', () => {
  it('maps a 4-point square to a closed SVG path + clip-path', () => {
    const def = customShapeToDef(makeShape());
    expect(def.kind).toBe('custom:fixture');
    expect(def.label).toBe('Fixture');
    expect(def.clipPath).toBe(
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    );
    expect(def.preview).toEqual({
      kind: 'path',
      d: 'M0 0 L100 0 L100 100 L0 100 Z',
    });
  });

  it('falls back to a square preview for under-3-point input (defensive)', () => {
    // The store's validateEntry should never let a <3-point shape
    // through, but the function is exported and the contract is
    // implicit — fall back rather than emit an empty `d` or
    // `polygon()` that would render an invisible shape.
    const def = customShapeToDef(
      makeShape({ points: [[0, 0], [100, 100]] })
    );
    expect(def.clipPath).toBeNull();
    expect(def.preview).toEqual({ kind: 'rect', rx: 12 });
  });

  it('handles arbitrary polygon shapes', () => {
    const triangle = makeShape({
      points: [
        [50, 0],
        [0, 100],
        [100, 100],
      ],
    });
    const def = customShapeToDef(triangle);
    expect(def.clipPath).toBe('polygon(50% 0%, 0% 100%, 100% 100%)');
    expect(def.preview).toEqual({
      kind: 'path',
      d: 'M50 0 L0 100 L100 100 Z',
    });
  });
});

describe('resolveShapeDef', () => {
  it('returns the built-in def for a built-in kind', () => {
    expect(resolveShapeDef('square', [])).toBe(SHAPE_BY_KIND.square);
    expect(resolveShapeDef('triangle', [])).toBe(SHAPE_BY_KIND.triangle);
  });

  it('returns the custom def for a custom: id present in the list', () => {
    const custom = makeShape();
    const def = resolveShapeDef('custom:fixture', [custom]);
    expect(def?.kind).toBe('custom:fixture');
    expect(def?.label).toBe('Fixture');
  });

  it('returns undefined for a custom: id not in the list (deleted)', () => {
    expect(resolveShapeDef('custom:gone' as CustomShapeId, [])).toBeUndefined();
  });

  it('returns undefined for an unknown built-in kind', () => {
    // Force-cast a bogus value; the runtime fallback is the caller's
    // responsibility, but the resolver should not throw.
    expect(
      resolveShapeDef('not-a-shape' as unknown as 'square', [])
    ).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(resolveShapeDef(undefined, [])).toBeUndefined();
  });
});

describe('useCustomShapesStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset store between tests so add/remove from one test don't
    // leak into another.
    useCustomShapesStore.setState({ customShapes: [] });
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('adds an entry and persists to localStorage with the versioned envelope', () => {
    const entry = useCustomShapesStore
      .getState()
      .add('My shape', [[0, 0], [100, 0], [50, 100]]);
    expect(entry.id.startsWith('custom:')).toBe(true);
    expect(useCustomShapesStore.getState().customShapes).toHaveLength(1);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].name).toBe('My shape');
  });

  it('renames an existing entry', () => {
    const entry = useCustomShapesStore
      .getState()
      .add('Original', [[0, 0], [100, 0], [50, 100]]);
    useCustomShapesStore.getState().rename(entry.id, 'Renamed');
    const stored = useCustomShapesStore.getState().customShapes[0];
    expect(stored.name).toBe('Renamed');
  });

  it('removes an entry', () => {
    const entry = useCustomShapesStore
      .getState()
      .add('Doomed', [[0, 0], [100, 0], [50, 100]]);
    useCustomShapesStore.getState().remove(entry.id);
    expect(useCustomShapesStore.getState().customShapes).toHaveLength(0);
  });

  it('trims and falls back the name', () => {
    const a = useCustomShapesStore
      .getState()
      .add('  ', [[0, 0], [100, 0], [50, 100]]);
    expect(a.name).toBe('Untitled shape');
  });

  it('caps oversized point arrays at MAX_POINTS', () => {
    // 1000-point input — well over the 256 cap. Should land at 256.
    const tons = Array.from({ length: 1000 }, (_, i) => [i % 100, i % 100] as const);
    const a = useCustomShapesStore.getState().add('Big', tons);
    expect(a.points.length).toBe(256);
  });
});
