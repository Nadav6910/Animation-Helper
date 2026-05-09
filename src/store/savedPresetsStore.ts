import { create } from 'zustand';
import type { AnimationConfig } from '@/types/animation';
import { uid } from '@/lib/uid';
import { validateAnimationConfig } from '@/lib/validateConfig';

const STORAGE_KEY = 'ah:saved-presets';
const SCHEMA_VERSION = 1;

export type SavedPreset = {
  id: string;
  name: string;
  createdAt: number;
  config: AnimationConfig;
};

type StoredPayload = {
  version: number;
  entries: SavedPreset[];
};

/**
 * Per-entry validation. Beyond the structural shape (id / name /
 * createdAt / config object), the inner `config` is now sent through
 * `validateAnimationConfig` so a tampered storage blob can't smuggle
 * CSS-injection payloads back into the app on reload — same defence
 * that `useUrlState` applies to `#c=` URL hashes.
 */
const validateEntry = (e: unknown): SavedPreset | null => {
  if (!e || typeof e !== 'object') return null;
  const o = e as Partial<SavedPreset>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.name !== 'string') return null;
  if (typeof o.createdAt !== 'number') return null;
  const config = validateAnimationConfig(o.config);
  if (!config) return null;
  return { id: o.id, name: o.name, createdAt: o.createdAt, config };
};

const loadInitial = (): SavedPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Accept both the legacy bare-array shape and the versioned
    // wrapper, so existing users don't lose their presets when they
    // upgrade to the schema-versioned write format.
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
    const out: SavedPreset[] = [];
    for (const e of entries) {
      const valid = validateEntry(e);
      if (valid) out.push(valid);
    }
    return out;
  } catch {
    return [];
  }
};

type PersistFailureListener = (err: unknown) => void;
const persistListeners = new Set<PersistFailureListener>();

/** Subscribe to localStorage write failures (quota / serialisation).
 *  The UI uses this to surface a toast so users know their save didn't
 *  actually persist. */
export function onSavedPresetsPersistError(fn: PersistFailureListener) {
  persistListeners.add(fn);
  return () => persistListeners.delete(fn);
}

const persist = (entries: SavedPreset[]) => {
  if (typeof window === 'undefined') return true;
  try {
    // Versioned wrapper so future schema changes can migrate cleanly
    // — the loader already accepts both bare-array and wrapper shapes
    // for back-compat, so flipping write format here is safe.
    const payload: StoredPayload = { version: SCHEMA_VERSION, entries };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    persistListeners.forEach((fn) => fn(err));
    return false;
  }
};

type State = {
  saved: SavedPreset[];
  /** Returns the saved entry if persisted, or null if the write failed
   *  (quota / serialisation) so the caller can show an error. */
  save: (name: string, config: AnimationConfig) => SavedPreset | null;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
};

export const useSavedPresetsStore = create<State>((set, get) => ({
  saved: loadInitial(),
  save: (name, config) => {
    const entry: SavedPreset = {
      id: `saved-${uid()}`,
      name: name.trim() || 'Untitled',
      createdAt: Date.now(),
      config: JSON.parse(JSON.stringify(config)),
    };
    const next = [entry, ...get().saved];
    const ok = persist(next);
    if (!ok) return null;
    set({ saved: next });
    return entry;
  },
  remove: (id) => {
    const next = get().saved.filter((p) => p.id !== id);
    persist(next);
    set({ saved: next });
  },
  rename: (id, name) => {
    const next = get().saved.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name } : p
    );
    persist(next);
    set({ saved: next });
  },
}));
