import { describe, it, expect } from 'vitest';
import { createHistoryRecorder } from '@/store/middleware/history';
import type { AnimationConfig } from '@/types/animation';

const baseConfig = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'shape',
  selector: '.shape',
  shape: 'square',
  keyframes: [
    { id: 'a', at: 0, opacity: 1 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1500,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
  ...overrides,
});

describe('history middleware', () => {
  it('records changes and supports undo / redo', () => {
    let t = 0;
    const h = createHistoryRecorder(baseConfig(), { debounceMs: 100, now: () => t });

    t = 1000;
    h.record(baseConfig({ duration: 2000 }));
    t = 2000;
    h.record(baseConfig({ duration: 3000 }));

    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);

    const back1 = h.undo();
    expect(back1?.duration).toBe(2000);
    const back2 = h.undo();
    expect(back2?.duration).toBe(1500);
    expect(h.canUndo()).toBe(false);

    const fwd = h.redo();
    expect(fwd?.duration).toBe(2000);
  });

  it('debounces rapid changes into a single history entry', () => {
    let t = 0;
    const h = createHistoryRecorder(baseConfig({ duration: 1000 }), {
      debounceMs: 300,
      now: () => t,
    });

    t = 10;
    h.record(baseConfig({ duration: 1100 }));
    t = 50;
    h.record(baseConfig({ duration: 1200 }));
    t = 100;
    h.record(baseConfig({ duration: 1300 }));

    const back = h.undo();
    expect(back?.duration).toBe(1000);
    expect(h.canUndo()).toBe(false);
  });

  it('ignores no-op records', () => {
    let t = 0;
    const cfg = baseConfig({ duration: 1500 });
    const h = createHistoryRecorder(cfg, { debounceMs: 0, now: () => t });
    t = 1000;
    h.record(baseConfig({ duration: 1500 }));
    expect(h.canUndo()).toBe(false);
  });

  it('clears redo stack on a new record', () => {
    let t = 0;
    const h = createHistoryRecorder(baseConfig({ duration: 100 }), {
      debounceMs: 0,
      now: () => t,
    });
    t = 1000;
    h.record(baseConfig({ duration: 200 }));
    h.undo();
    expect(h.canRedo()).toBe(true);
    t = 2000;
    h.record(baseConfig({ duration: 300 }));
    expect(h.canRedo()).toBe(false);
  });

  it('tracks dirty state vs the pristine snapshot', () => {
    let t = 0;
    const h = createHistoryRecorder(baseConfig({ duration: 100 }), {
      debounceMs: 0,
      now: () => t,
    });
    expect(h.isDirty()).toBe(false);
    t = 1000;
    h.record(baseConfig({ duration: 200 }));
    expect(h.isDirty()).toBe(true);
    h.markPristine();
    expect(h.isDirty()).toBe(false);
  });
});
