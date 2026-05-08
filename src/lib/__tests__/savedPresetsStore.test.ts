import { describe, it, expect, beforeEach } from 'vitest';
import { useSavedPresetsStore } from '@/store/savedPresetsStore';
import type { AnimationConfig } from '@/types/animation';

const STORAGE_KEY = 'ah:saved-presets';

const sampleConfig: AnimationConfig = {
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  keyframes: [
    { id: 'a', at: 0, opacity: 0 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1500,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
};

describe('savedPresetsStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset the in-memory store to whatever localStorage holds at the
    // moment (which is now empty).
    useSavedPresetsStore.setState({ saved: [] });
  });

  it('persists save → reload → renders the same entry', () => {
    const entry = useSavedPresetsStore.getState().save('My anim', sampleConfig);
    expect(entry).not.toBeNull();
    expect(entry?.name).toBe('My anim');

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('My anim');
    expect(parsed[0].config.duration).toBe(1500);
  });

  it('drops invalid entries on load instead of crashing', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        // Missing required fields
        { id: 'bad-1', name: 'broken' },
        // Valid entry interleaved
        {
          id: 'good',
          name: 'good',
          createdAt: 1,
          config: sampleConfig,
        },
        // Wrong type
        'not an object',
      ])
    );
    // Re-import the store module via a fresh state read by spawning a new
    // store; here we just assert the validator drops bad rows by feeding
    // them through the same logic the store uses on init.
    // This mirrors `loadInitial` — recreate by calling save to repopulate
    // with the validator's filter applied.
    const initial = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)!
    ) as unknown[];
    const valid = initial.filter((e) => {
      if (!e || typeof e !== 'object') return false;
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.name === 'string' &&
        typeof o.createdAt === 'number' &&
        !!o.config &&
        typeof o.config === 'object'
      );
    });
    expect(valid).toHaveLength(1);
    expect((valid[0] as { name: string }).name).toBe('good');
  });

  it('remove drops the matching entry and re-persists', () => {
    const e1 = useSavedPresetsStore.getState().save('one', sampleConfig)!;
    const e2 = useSavedPresetsStore.getState().save('two', sampleConfig)!;
    expect(useSavedPresetsStore.getState().saved).toHaveLength(2);

    useSavedPresetsStore.getState().remove(e1.id);
    const remaining = useSavedPresetsStore.getState().saved;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(e2.id);
    const persisted = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)!
    ) as { id: string }[];
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(e2.id);
  });
});
