import { describe, it, expect } from 'vitest';
import { PRESETS, presetsByCategory, randomPreset } from '@/lib/presets';
import { generateCss } from '@/lib/generateCss';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateFramerMotion } from '@/lib/generateFramerMotion';

describe('presets', () => {
  it('every preset builds a valid AnimationConfig', () => {
    for (const p of PRESETS) {
      const cfg = p.build();
      expect(cfg.keyframes.length).toBeGreaterThanOrEqual(2);
      const ats = cfg.keyframes.map((k) => k.at);
      expect(Math.min(...ats)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ats)).toBeLessThanOrEqual(100);
      expect(cfg.duration).toBeGreaterThan(0);
    }
  });

  it('every preset round-trips through all three generators without throwing', () => {
    for (const p of PRESETS) {
      const cfg = p.build();
      expect(() => generateCss(cfg)).not.toThrow();
      expect(() => generateTailwind(cfg)).not.toThrow();
      expect(() => generateFramerMotion(cfg)).not.toThrow();
    }
  });

  it('two builds of the same preset produce independent keyframe ids', () => {
    for (const p of PRESETS) {
      const a = p.build();
      const b = p.build();
      const idsA = a.keyframes.map((k) => k.id);
      const idsB = b.keyframes.map((k) => k.id);
      const overlap = idsA.filter((id) => idsB.includes(id));
      expect(overlap.length).toBe(0);
    }
  });

  it('presetsByCategory returns matching entries', () => {
    expect(presetsByCategory('entrance').length).toBeGreaterThan(0);
    expect(
      presetsByCategory('entrance').every((p) => p.category === 'entrance')
    ).toBe(true);
  });

  it('randomPreset uses the provided rng', () => {
    const r = randomPreset(undefined, () => 0);
    expect(r).toBe(PRESETS[0]);
  });

  it('randomPreset excludes the given id from the pool', () => {
    const first = PRESETS[0];
    // rng = 0 → first index of pool. With first excluded the pool's
    // first item is PRESETS[1], so we should never get first back.
    const r = randomPreset(first.id, () => 0);
    expect(r).not.toBe(first);
    expect(r.id).not.toBe(first.id);
  });

  it('randomPreset never returns the same preset twice in a row across 50 calls', () => {
    let last: string | null = null;
    let rng = 0;
    // Walk the rng across PRESETS.length so the call would otherwise
    // repeat — without the excludeId guard, two consecutive calls with
    // the same rng would return the same preset.
    for (let i = 0; i < 50; i++) {
      const p = randomPreset(last ?? undefined, () => rng);
      expect(p.id).not.toBe(last);
      last = p.id;
      rng = (rng + 1 / PRESETS.length) % 1;
    }
  });
});
