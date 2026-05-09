import { describe, it, expect } from 'vitest';
import { clampTime, formatTime, totalDuration } from '@/lib/timing';
import type { AnimationConfig } from '@/types/animation';

const cfg = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  keyframes: [
    { id: 'a', at: 0, opacity: 0 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
  ...overrides,
});

describe('totalDuration', () => {
  it('renders one iteration of an infinite preset', () => {
    expect(totalDuration(cfg({ duration: 1500, delay: 0, iterations: 'infinite' }))).toBe(1500);
  });

  it('multiplies by finite iteration count', () => {
    expect(totalDuration(cfg({ duration: 500, delay: 0, iterations: 3 }))).toBe(1500);
  });

  it('adds the leading delay', () => {
    expect(totalDuration(cfg({ duration: 1000, delay: 250, iterations: 1 }))).toBe(1250);
  });

  it('collapses NaN / Infinity / negative values to safe defaults', () => {
    expect(totalDuration(cfg({ duration: NaN, delay: 0, iterations: 1 }))).toBe(0);
    expect(totalDuration(cfg({ duration: 1000, delay: Infinity, iterations: 1 }))).toBe(1000);
    expect(totalDuration(cfg({ duration: -500, delay: 0, iterations: 1 }))).toBe(0);
    expect(totalDuration(cfg({ duration: 1000, delay: 0, iterations: 0 }))).toBe(1000);
  });

  it('doubles infinite-loop duration for alternate directions (one perceptual loop = forward + reverse)', () => {
    expect(
      totalDuration(
        cfg({ duration: 1500, iterations: 'infinite', direction: 'alternate' })
      )
    ).toBe(3000);
    expect(
      totalDuration(
        cfg({ duration: 1500, iterations: 'infinite', direction: 'alternate-reverse' })
      )
    ).toBe(3000);
  });

  it('does not double for finite alternate runs — uses the literal iteration count', () => {
    expect(
      totalDuration(
        cfg({ duration: 1000, iterations: 3, direction: 'alternate' })
      )
    ).toBe(3000);
  });
});

describe('clampTime', () => {
  it('clamps below 0 to 0', () => {
    expect(clampTime(-100, cfg({ duration: 1000, delay: 0, iterations: 1 }))).toBe(0);
  });
  it('clamps above totalDuration to total', () => {
    expect(clampTime(5000, cfg({ duration: 1000, delay: 0, iterations: 1 }))).toBe(1000);
  });
  it('rounds fractional inputs', () => {
    expect(clampTime(123.7, cfg({ duration: 1000, delay: 0, iterations: 1 }))).toBe(124);
  });
});

describe('formatTime', () => {
  it('uses ms below 1 second', () => {
    expect(formatTime(0)).toBe('0ms');
    expect(formatTime(700)).toBe('700ms');
  });
  it('uses 2-decimal seconds between 1 and 10', () => {
    expect(formatTime(1500)).toBe('1.50s');
  });
  it('uses 1-decimal seconds at 10s and above', () => {
    expect(formatTime(12500)).toBe('12.5s');
  });
  it('rejects non-finite / negative inputs', () => {
    expect(formatTime(NaN)).toBe('0ms');
    expect(formatTime(-5)).toBe('0ms');
  });
});
