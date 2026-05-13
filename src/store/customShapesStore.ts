import { create } from 'zustand';
import { uid } from '@/lib/uid';
import type { ClipPathPoint } from '@/lib/clipPath';
import type { CustomShape, CustomShapeId } from '@/types/animation';

const STORAGE_KEY = 'ah:custom-shapes';
const SCHEMA_VERSION = 1;

// Defensive caps on stored entries — a tampered storage blob with
// 100k points or a 1MB name would otherwise persist forever and
// bloat every CRUD round-trip. Picked generously: a star has 10
// points, an intricate hand-drawn shape might use 30; 256 is well
// past any legitimate use. Same for name length.
const MAX_POINTS = 256;
const MAX_NAME_LENGTH = 120;

type StoredPayload = {
  version: number;
  entries: CustomShape[];
};

/**
 * Per-entry validation. Beyond the structural shape, each point is
 * checked for finiteness and the array is bounded in size. Out-of-
 * range percentages (negative or > 100) are allowed because CSS
 * clip-path accepts them (the polygon visibly extends past the box) —
 * the bound is just a DoS-on-self guard, not a correctness check.
 */
const validateEntry = (e: unknown): CustomShape | null => {
  if (!e || typeof e !== 'object') return null;
  const o = e as Partial<CustomShape> & { id?: unknown };
  if (typeof o.id !== 'string' || !o.id.startsWith('custom:')) return null;
  if (typeof o.name !== 'string' || !o.name.trim()) return null;
  if (o.name.length > MAX_NAME_LENGTH) return null;
  if (typeof o.createdAt !== 'number') return null;
  if (!Array.isArray(o.points) || o.points.length < 3) return null;
  if (o.points.length > MAX_POINTS) return null;
  const points: ClipPathPoint[] = [];
  for (const p of o.points) {
    if (!Array.isArray(p) || p.length !== 2) return null;
    const [x, y] = p;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      return null;
    }
    points.push([x, y]);
  }
  return {
    id: o.id as CustomShapeId,
    name: o.name,
    createdAt: o.createdAt,
    points,
  };
};

const loadInitial = (): CustomShape[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Accept both legacy bare-array and versioned envelope payloads.
    let entries: unknown[];
    if (Array.isArray(parsed)) {
      entries = parsed;
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as StoredPayload).entries)
    ) {
      entries = (parsed as StoredPayload).entries;
    } else {
      return [];
    }
    const out: CustomShape[] = [];
    for (const e of entries) {
      const v = validateEntry(e);
      if (v) out.push(v);
    }
    return out;
  } catch {
    return [];
  }
};

// Notify GlobalToast when persistence fails. Mirrors the
// `customPathsStore` and `savedPresetsStore` pattern — all three
// write to localStorage under `ah:*`, all three can hit quota, all
// three surface a toast so the user knows their edit didn't survive
// page reload. Without this, a silent persist failure would manifest
// as "I saved a shape, came back, it's gone" with no warning.
type PersistFailureListener = (err: unknown) => void;
const persistListeners = new Set<PersistFailureListener>();

export function onCustomShapesPersistError(fn: PersistFailureListener) {
  persistListeners.add(fn);
  return () => persistListeners.delete(fn);
}

const persist = (entries: CustomShape[]): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const payload: StoredPayload = { version: SCHEMA_VERSION, entries };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    persistListeners.forEach((fn) => fn(err));
    return false;
  }
};

// TODO(cross-tab-sync): no `storage` event listener — two tabs writing
// concurrently will diverge until reload. Acceptable for v1 since
// users rarely have the editor open in multiple tabs; revisit if it
// becomes a complaint.

type State = {
  customShapes: CustomShape[];
  add: (name: string, points: ReadonlyArray<ClipPathPoint>) => CustomShape;
  rename: (id: CustomShapeId, name: string) => void;
  remove: (id: CustomShapeId) => void;
};

export const useCustomShapesStore = create<State>((set, get) => ({
  customShapes: loadInitial(),
  add: (name, points) => {
    const safeName = (name.trim() || 'Untitled shape').slice(
      0,
      MAX_NAME_LENGTH
    );
    const cappedPoints: ClipPathPoint[] = points
      .slice(0, MAX_POINTS)
      .map(([x, y]) => [x, y] as ClipPathPoint);
    const entry: CustomShape = {
      id: `custom:${uid()}` as CustomShapeId,
      name: safeName,
      points: cappedPoints,
      createdAt: Date.now(),
    };
    const next = [...get().customShapes, entry];
    set({ customShapes: next });
    persist(next);
    return entry;
  },
  rename: (id, name) => {
    const safeName = (name.trim() || 'Untitled shape').slice(
      0,
      MAX_NAME_LENGTH
    );
    const next = get().customShapes.map((s) =>
      s.id === id ? { ...s, name: safeName } : s
    );
    set({ customShapes: next });
    persist(next);
  },
  remove: (id) => {
    const next = get().customShapes.filter((s) => s.id !== id);
    set({ customShapes: next });
    persist(next);
  },
}));
