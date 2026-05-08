import { describe, it, expect } from 'vitest';
import { springToCubic, springToEasing, DEFAULT_SPRING } from '@/lib/spring';

describe('spring', () => {
  it('produces a 4-tuple within sane bounds', () => {
    const v = springToCubic(DEFAULT_SPRING);
    expect(v).toHaveLength(4);
    expect(v[0]).toBeGreaterThanOrEqual(0);
    expect(v[0]).toBeLessThanOrEqual(1);
    expect(v[2]).toBeGreaterThanOrEqual(0);
    expect(v[2]).toBeLessThanOrEqual(1);
  });

  it('underdamped springs produce overshoot (y2 > 1)', () => {
    const v = springToCubic({ stiffness: 200, damping: 6, mass: 1 });
    expect(v[3]).toBeGreaterThan(1);
  });

  it('overdamped springs produce no overshoot (y2 ~ 1)', () => {
    const v = springToCubic({ stiffness: 80, damping: 40, mass: 1 });
    expect(v[3]).toBeLessThanOrEqual(1.01);
  });

  it('springToEasing wraps output in a cubic Easing', () => {
    const e = springToEasing(DEFAULT_SPRING);
    expect(e.kind).toBe('cubic');
  });
});
