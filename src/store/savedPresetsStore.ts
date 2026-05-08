import { create } from 'zustand';
import type { AnimationConfig } from '@/types/animation';

const STORAGE_KEY = 'ah:saved-presets';

export type SavedPreset = {
  id: string;
  name: string;
  createdAt: number;
  config: AnimationConfig;
};

const loadInitial = (): SavedPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPreset[]) : [];
  } catch {
    return [];
  }
};

const persist = (entries: SavedPreset[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota errors */
  }
};

const uid = () => Math.random().toString(36).slice(2, 9);

type State = {
  saved: SavedPreset[];
  save: (name: string, config: AnimationConfig) => SavedPreset;
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
    persist(next);
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
