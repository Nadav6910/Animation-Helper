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
    const r = randomPreset(() => 0);
    expect(r).toBe(PRESETS[0]);
  });
});
