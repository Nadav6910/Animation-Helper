import { create } from 'zustand';
import { uid } from '@/lib/uid';
import { isSafePathD } from '@/lib/svgPathSafety';

const STORAGE_KEY = 'ah:custom-paths';
const SCHEMA_VERSION = 1;

export type CustomPath = {
  id: string;
  label: string;
  viewBox: string;
  d: string;
};

type StoredPayload = {
  version: number;
  entries: CustomPath[];
};

// Same `0 0 W H` viewBox grammar generateHtml's `safeViewBox` accepts.
// Numbers only, four whitespace-separated tokens. Anything else is
// rejected so a tampered storage entry can't smuggle attribute-
// injection into the live `<svg viewBox=...>` slot.
const VIEWBOX_RE =
  /^-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?$/;

const validateEntry = (e: unknown): CustomPath | null => {
  if (!e || typeof e !== 'object') return null;
  const o = e as Partial<CustomPath>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.label !== 'string' || o.label.length > 200) return null;
  if (typeof o.viewBox !== 'string' || !VIEWBOX_RE.test(o.viewBox)) return null;
  if (typeof o.d !== 'string' || !isSafePathD(o.d)) return null;
  return { id: o.id, label: o.label, viewBox: o.viewBox, d: o.d };
};

const loadInitial = (): CustomPath[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Accept legacy bare-array and versioned wrapper shapes so
    // existing users keep their paths after the schema-version
    // upgrade.
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
    const out: CustomPath[] = [];
    for (const e of entries) {
      const valid = validateEntry(e);
      if (valid) out.push(valid);
    }
    return out;
  } catch {
    return [];
  }
};

// Notify GlobalToast when persistence fails. Mirrors the
// `savedPresetsStore` pattern — both stores write to localStorage,
// both can hit quota, both surface a toast so the user knows their
// edit didn't survive page reload. The previous "swallow silently"
// behaviour produced a confusing UX where the user added a path,
// closed the tab, and came back to find it gone with no warning.
type PersistFailureListener = (err: unknown) => void;
const persistListeners = new Set<PersistFailureListener>();

export function onCustomPathsPersistError(fn: PersistFailureListener) {
  persistListeners.add(fn);
  return () => persistListeners.delete(fn);
}

const persist = (entries: CustomPath[]): boolean => {
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

type State = {
  paths: CustomPath[];
  add: (p: Omit<CustomPath, 'id'>) => CustomPath;
  remove: (id: string) => void;
};

export const useCustomPathsStore = create<State>((set, get) => ({
  paths: loadInitial(),
  add: (p) => {
    const entry: CustomPath = { id: `custom-${uid()}`, ...p };
    const next = [entry, ...get().paths];
    persist(next);
    set({ paths: next });
    return entry;
  },
  remove: (id) => {
    const next = get().paths.filter((p) => p.id !== id);
    persist(next);
    set({ paths: next });
  },
}));
