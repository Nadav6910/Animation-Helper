import { create } from 'zustand';
import { uid } from '@/lib/uid';

const STORAGE_KEY = 'ah:custom-paths';

export type CustomPath = {
  id: string;
  label: string;
  viewBox: string;
  d: string;
};

const loadInitial = (): CustomPath[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomPath[]) : [];
  } catch {
    return [];
  }
};

const persist = (entries: CustomPath[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
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
