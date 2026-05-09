import type { AnimationConfig } from '@/types/animation';
import { ENTRANCE_PRESETS } from './entrance';
import { EXIT_PRESETS } from './exit';
import { ATTENTION_PRESETS } from './attention';
import { LOADER_PRESETS } from './loaders';
import { TEXT_PRESETS } from './text';
import type { Preset, PresetCategory } from './types';

export type { Preset, PresetCategory } from './types';

export const PRESETS: Preset[] = [
  ...ENTRANCE_PRESETS,
  ...EXIT_PRESETS,
  ...ATTENTION_PRESETS,
  ...LOADER_PRESETS,
  ...TEXT_PRESETS,
];

export const PRESET_CATEGORIES: { id: PresetCategory; label: string }[] = [
  { id: 'entrance', label: 'Entrance' },
  { id: 'exit', label: 'Exit' },
  { id: 'attention', label: 'Attention' },
  { id: 'loaders', label: 'Loaders' },
  { id: 'text', label: 'Text' },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function presetsByCategory(category: PresetCategory): Preset[] {
  return PRESETS.filter((p) => p.category === category);
}

/**
 * Pick a random preset, optionally avoiding `excludeId` so consecutive
 * Surprise-me clicks never produce the same preset twice in a row.
 * Falls back to the full pool if excludeId isn't found or PRESETS only
 * has one entry.
 */
export function randomPreset(
  excludeId?: string,
  rand: () => number = Math.random
): Preset {
  const pool =
    excludeId && PRESETS.length > 1
      ? PRESETS.filter((p) => p.id !== excludeId)
      : PRESETS;
  const i = Math.floor(rand() * pool.length);
  return pool[i];
}

export function buildPreset(id: string): AnimationConfig | null {
  const p = getPreset(id);
  return p ? p.build() : null;
}
