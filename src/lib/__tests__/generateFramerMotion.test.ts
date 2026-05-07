import { describe, it, expect } from 'vitest';
import { generateFramerMotion } from '../generateFramerMotion';
import type { AnimationConfig } from '@/types/animation';

const cfg: AnimationConfig = {
  target: 'shape',
  selector: '.shape',
  keyframes: [
    { id: 'a', at: 0, transform: { translate: [0, 0] }, opacity: 0 },
    { id: 'b', at: 100, transform: { translate: [80, 0] }, opacity: 1 },
  ],
  duration: 2000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease-in-out' },
};

describe('generateFramerMotion', () => {
  it('outputs a motion.div component', () => {
    const out = generateFramerMotion(cfg);
    expect(out).toContain("import { motion } from 'framer-motion'");
    expect(out).toContain('<motion.div');
  });

  it('serializes channels as arrays with one entry per keyframe', () => {
    const out = generateFramerMotion(cfg);
    expect(out).toMatch(/x: \[0, 80\]/);
    expect(out).toMatch(/opacity: \[0, 1\]/);
  });

  it('uses Infinity for infinite iteration count', () => {
    const out = generateFramerMotion(cfg);
    expect(out).toContain('repeat: Infinity');
  });

  it('uses repeatType="reverse" for alternate direction', () => {
    const out = generateFramerMotion({ ...cfg, direction: 'alternate' });
    expect(out).toContain("repeatType: 'reverse'");
  });

  it('emits times array normalized to 0-1', () => {
    const out = generateFramerMotion({
      ...cfg,
      keyframes: [
        { id: 'a', at: 0, transform: { translate: [0, 0] } },
        { id: 'b', at: 50, transform: { translate: [40, 0] } },
        { id: 'c', at: 100, transform: { translate: [80, 0] } },
      ],
    });
    expect(out).toContain('times: [0, 0.5, 1]');
  });
});
