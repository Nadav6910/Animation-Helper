import { create } from 'zustand';
import { uid } from '@/lib/uid';
import type { ClipPathPoint } from '@/lib/clipPath';
import type { CustomShapeId } from '@/types/animation';

const STORAGE_KEY = 'ah:custom-shapes';
const SCHEMA_VERSION = 1;

/** A user-authored polygon shape persisted to localStorage. The `id`
 *  is always the `custom:<uid>` form so ShapeKind discrimination is
 *  trivial at lookup time. */
export type CustomShape = {
  id: CustomShapeId;
  name: string;
  points: ClipPathPoint[];
  createdAt: number;
};

type StoredPayload = {
  version: number;
  entries: CustomShape[];
};

/**
 * Per-entry validation. Beyond the structural shape (id / name /
 * createdAt / points), each point is checked to be a 2-tuple of
 * finite percentages — a tampered storage blob can't smuggle weird
 * values that would break the generator or the renderer.
 */
const validateEntry = (e: unknown): CustomShape | null => {
  if (!e || typeof e !== 'object') return null;
  const o = e as Partial<CustomShape>;
  if (typeof o.id !== 'string' || !o.id.startsWith('custom:')) return null;
  if (typeof o.name !== 'string' || !o.name.trim()) return null;
  if (typeof o.createdAt !== 'number') return null;
  if (!Array.isArray(o.points) || o.points.length < 3) return null;
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

const persist = (entries: CustomShape[]) => {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredPayload = { version: SCHEMA_VERSION, entries };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage may be unavailable (Safari private, full quota);
       ignore — the in-memory state still reflects the latest CRUD. */
  }
};

type State = {
  customShapes: CustomShape[];
  add: (name: string, points: ClipPathPoint[]) => CustomShape;
  rename: (id: CustomShapeId, name: string) => void;
  remove: (id: CustomShapeId) => void;
};

export const useCustomShapesStore = create<State>((set, get) => ({
  customShapes: loadInitial(),
  add: (name, points) => {
    const safeName = name.trim() || 'Untitled shape';
    const entry: CustomShape = {
      id: `custom:${uid()}` as CustomShapeId,
      name: safeName,
      points: points.map(([x, y]) => [x, y] as ClipPathPoint),
      createdAt: Date.now(),
    };
    const next = [...get().customShapes, entry];
    set({ customShapes: next });
    persist(next);
    return entry;
  },
  rename: (id, name) => {
    const safeName = name.trim() || 'Untitled shape';
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
