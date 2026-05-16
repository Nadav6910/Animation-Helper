import { describe, it, expect, beforeEach } from 'vitest';
import { useAnimationStore } from '@/store/animationStore';
import type { AnimationConfig } from '@/types/animation';

const textConfig: AnimationConfig = {
  target: 'text',
  selector: '.animated',
  text: 'Hello World',
  keyframes: [
    { id: 'a', at: 0, opacity: 0 },
    { id: 'b', at: 100, opacity: 1 },
  ],
  duration: 1000,
  delay: 0,
  iterations: 1,
  direction: 'normal',
  fill: 'forwards',
  easing: { kind: 'preset', value: 'linear' },
};

const get = () => useAnimationStore.getState();
const cfg = () => get().config;

beforeEach(() => {
  useAnimationStore.setState({
    config: JSON.parse(JSON.stringify(textConfig)),
  });
});

describe('animationStore — setTokenizeMode', () => {
  it("stores 'word' and absent for 'letter'", () => {
    get().setTokenizeMode('word');
    expect(cfg().tokenizeMode).toBe('word');
    get().setTokenizeMode('letter');
    expect(cfg().tokenizeMode).toBeUndefined();
  });

  it('clears now-stale tokenAnimations when the mode flips', () => {
    get().setTokenAnimations([{ tokens: [0], presetId: 'p' }]);
    get().setTokenizeMode('word');
    expect(cfg().tokenAnimations).toBeUndefined();
  });

  it('is a no-op when the mode is unchanged (keeps overrides)', () => {
    get().setTokenAnimations([{ tokens: [0], presetId: 'p' }]);
    get().setTokenizeMode('letter'); // already letter (absent)
    expect(cfg().tokenAnimations).toEqual([{ tokens: [0], presetId: 'p' }]);
  });

  it('is a no-op for a non-text target', () => {
    useAnimationStore.setState({
      config: { ...JSON.parse(JSON.stringify(textConfig)), target: 'shape' },
    });
    get().setTokenizeMode('word');
    expect(cfg().tokenizeMode).toBeUndefined();
  });
});

describe('animationStore — setTokenAnimations', () => {
  it('normalises an empty array to undefined', () => {
    get().setTokenAnimations([]);
    expect(cfg().tokenAnimations).toBeUndefined();
  });

  it('preserves a non-empty list', () => {
    get().setTokenAnimations([{ tokens: [1, 2], presetId: 'p' }]);
    expect(cfg().tokenAnimations).toEqual([{ tokens: [1, 2], presetId: 'p' }]);
  });
});

describe('animationStore — assignTokenPreset / clearTokenPreset', () => {
  it('assigns against the live config and clears empties to undefined', () => {
    get().assignTokenPreset([0, 2], 'text-wave');
    expect(cfg().tokenAnimations).toEqual([
      { tokens: [0, 2], presetId: 'text-wave' },
    ]);
    get().clearTokenPreset([0, 2]);
    expect(cfg().tokenAnimations).toBeUndefined();
  });

  it('moves a token between presets without double-assigning', () => {
    get().assignTokenPreset([0, 1, 2], 'a');
    get().assignTokenPreset([1], 'b');
    expect(cfg().tokenAnimations).toEqual([
      { tokens: [0, 2], presetId: 'a' },
      { tokens: [1], presetId: 'b' },
    ]);
  });

  it('is a no-op for a non-text target', () => {
    useAnimationStore.setState({
      config: { ...JSON.parse(JSON.stringify(textConfig)), target: 'shape' },
    });
    get().assignTokenPreset([0], 'p');
    expect(cfg().tokenAnimations).toBeUndefined();
  });
});

describe('animationStore — setTarget drops text-only token fields', () => {
  it('strips tokenizeMode + tokenAnimations leaving text', () => {
    get().setTokenizeMode('word');
    get().setTokenAnimations([{ tokens: [0], presetId: 'p' }]);
    get().setTarget('shape');
    expect(cfg().tokenizeMode).toBeUndefined();
    expect(cfg().tokenAnimations).toBeUndefined();
  });
});
