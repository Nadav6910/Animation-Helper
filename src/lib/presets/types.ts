import type { AnimationConfig } from '@/types/animation';

export type PresetCategory = 'entrance' | 'exit' | 'attention' | 'loaders' | 'text';

export type Preset = {
  id: string;
  name: string;
  category: PresetCategory;
  description?: string;
  /** Returns a fresh, mutable AnimationConfig (no shared keyframe ids). */
  build: () => AnimationConfig;
};
