import { create } from 'zustand';
import type { AnimationConfig } from '@/types/animation';
import { uid } from '@/lib/uid';

const STORAGE_KEY = 'ah:saved-presets';

export type SavedPreset = {
  id: string;
  name: string;
  createdAt: number;
  config: AnimationConfig;
};

/**
 * Per-entry validation. We accept anything Array.isArray returns — so a
 * tampered storage blob doesn't crash the gallery — but each entry is
 * checked individually. Bad entries are skipped, not coerced, so a half-
 * corrupt store still loads the good half.
 */
const isValidEntry = (e: unknown): e is SavedPreset => {
  if (!e || typeof e !== 'object') return false;
  const o = e as Partial<SavedPreset>;
  if (typeof o.id !== 'string' || !o.id) return false;
  if (typeof o.name !== 'string') return false;
  if (typeof o.createdAt !== 'number') return false;
  if (!o.config || typeof o.config !== 'object') return false;
  const cfg = o.config as Partial<AnimationConfig>;
  if (!Array.isArray(cfg.keyframes) || cfg.keyframes.length < 1) return false;
  if (typeof cfg.duration !== 'number') return false;
  return true;
};

const loadInitial = (): SavedPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
