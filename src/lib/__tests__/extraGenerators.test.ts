import { describe, it, expect } from 'vitest';
import { generateScss } from '@/lib/generateScss';
import { generateWaapi } from '@/lib/generateWaapi';
import { generateStyledComponents } from '@/lib/generateStyledComponents';
import { generateVue } from '@/lib/generateVue';
import { generateSvelte } from '@/lib/generateSvelte';
import { generateReactComponent } from '@/lib/generateReactComponent';
import { generateHtml } from '@/lib/generateHtml';
import type { AnimationConfig } from '@/types/animation';

const cfg: AnimationConfig = {
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  text: 'Hi',
  svgPath: 'check',
  keyframes: [
    { id: 'a', at: 0, opacity: 0, transform: { translate: [0, 0] } },
    { id: 'b', at: 100, opacity: 1, transform: { translate: [80, 0] } },
  ],
  duration: 1000,
  delay: 0,
  iterations: 'infinite',
  direction: 'normal',
  fill: 'none',
  easing: { kind: 'preset', value: 'ease' },
};

describe('generateScss', () => {
  it('emits a mixin with keyframes', () => {
    const out = generateScss(cfg);
    expect(out).toContain('@mixin');
    expect(out).toContain('@keyframes play');
    expect(out).toContain('animation: play');
  });
});

describe('generateWaapi', () => {
  it('emits an element.animate() call', () => {
    const out = generateWaapi(cfg);
    expect(out).toContain('el.animate(');
    expect(out).toContain('iterations: Infinity');
    expect(out).toContain("easing: 'ease'");
  });

  it('serializes per-keyframe offsets', () => {
    const out = generateWaapi({
      ...cfg,
      keyframes: [
        { id: 'a', at: 0, opacity: 0 },
        { id: 'b', at: 50, opacity: 0.5 },
        { id: 'c', at: 100, opacity: 1 },
      ],
    });
    expect(out).toMatch(/offset:\s*0(\.|,)/);
    expect(out).toMatch(/offset:\s*0\.5/);
    expect(out).toMatch(/offset:\s*1/);
  });
});

describe('generateStyledComponents', () => {
  it('emits a styled.div + keyframes import', () => {
    const out = generateStyledComponents(cfg);
    expect(out).toContain("import styled, { keyframes } from 'styled-components'");
    expect(out).toContain('styled.div`');
    expect(out).toContain('${play}');
  });
});

describe('generateVue', () => {
  it('emits a SFC with scoped style', () => {
    const out = generateVue(cfg);
    expect(out).toContain('<template>');
    expect(out).toContain('<style scoped>');
    expect(out).toContain('animation: play');
  });
});

describe('generateSvelte', () => {
  it('emits div + style block', () => {
    const out = generateSvelte(cfg);
    expect(out).toContain('<style>');
    expect(out).toContain('animation: play');
  });
});

describe('generateReactComponent', () => {
  it('emits a self-contained component file', () => {
    const out = generateReactComponent(cfg);
    expect(out).toContain('export function AnimatedBox()');
    expect(out).toContain('<style>{css}</style>');
    expect(out).toContain('animation: play');
  });
});

describe('generateHtml', () => {
  it('emits a doctype with embedded CSS', () => {
    const out = generateHtml(cfg);
    expect(out.startsWith('<!doctype html>')).toBe(true);
    expect(out).toContain('animation: play');
    expect(out).toContain('class="animated"');
  });

  it('renders text targets with the chosen text', () => {
    const out = generateHtml({ ...cfg, target: 'text', text: 'Hello' });
    expect(out).toContain('Hello');
  });
});
