import { describe, it, expect } from 'vitest';
import { generateLottie } from '@/lib/generateLottie';
import type { AnimationConfig } from '@/types/animation';

const cfg = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  text: 'Animate',
  svgPath: 'check',
  keyframes: [
    { id: 'a', at: 0, opacity: 0, transform: { translate: [0, 0], scale: [1, 1] } },
    { id: 'b', at: 100, opacity: 1, transform: { translate: [80, 0], scale: [1.2, 1.2] } },
  ],
  duration: 1000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease-in-out' },
  ...overrides,
});

type LottieDoc = {
  v: string;
  fr: number;
  ip: number;
  op: number;
  cm: string;
  layers: { ks: { o: { a: number; k: unknown }; p: { a: number; k: unknown }; s: { a: number; k: unknown } } }[];
};

const parse = (s: string): LottieDoc => JSON.parse(s) as LottieDoc;

describe('generateLottie', () => {
  it('emits parseable JSON with the schema version + framerate', () => {
    const out = generateLottie(cfg(), { fps: 60 });
    const parsed = parse(out);
    expect(parsed.v).toMatch(/^5\./);
    expect(parsed.fr).toBe(60);
    expect(parsed.op).toBeGreaterThan(0);
  });

  it('marks position / opacity as animated when keyframes change', () => {
    const out = generateLottie(cfg());
    const parsed = parse(out);
    const ks = parsed.layers[0].ks;
    expect(ks.p.a).toBe(1);
    expect(ks.o.a).toBe(1);
  });

  it('marks scale as animated when keyframes change', () => {
    const out = generateLottie(cfg());
    const parsed = parse(out);
    expect(parsed.layers[0].ks.s.a).toBe(1);
  });

  it('records dropped features in the `cm` field', () => {
    const out = generateLottie(
      cfg({
        target: 'text',
        keyframes: [
          { id: 'a', at: 0, blur: 5, opacity: 1 },
          { id: 'b', at: 100, blur: 0, opacity: 1 },
        ],
        offsetPath: { d: 'M0,0 L80,0' },
      })
    );
    const parsed = parse(out);
    expect(parsed.cm).toContain('blur');
    expect(parsed.cm).toContain('offset-path');
    expect(parsed.cm).toContain('text');
  });
});
