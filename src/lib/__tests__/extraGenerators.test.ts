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
    // We JSON.stringify string literals to keep selectors safe — quotes
    // are " not ' in the output.
    expect(out).toContain('easing: "ease"');
  });

  it('emits offsetPath as element style when set', () => {
    const out = generateWaapi({
      ...cfg,
      offsetPath: { d: 'M0,0 L100,0', rotate: 'auto' },
    });
    expect(out).toContain('el.style.offsetPath = "path(\'M0,0 L100,0\')"');
    expect(out).toContain('el.style.offsetRotate = "auto"');
  });

  it('emits stroke-dasharray normalisation for SVG targets', () => {
    const out = generateWaapi({ ...cfg, target: 'svg' });
    expect(out).toContain("el.setAttribute('stroke-dasharray', '100')");
  });

  it('emits per-letter stagger loop when text + stagger', () => {
    const out = generateWaapi({
      ...cfg,
      target: 'text',
      stagger: { step: 80 },
    });
    expect(out).toContain('querySelectorAll');
    expect(out).toContain('i * 80');
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

  it('strips angle brackets from CSS values so </style> can\'t break out', () => {
    // Imagine a tampered share URL that injected </style><script>alert(1)
    // into the bg gradient string.
    const out = generateHtml({
      ...cfg,
      keyframes: [
        {
          id: 'a',
          at: 0,
          bg: 'linear-gradient(45deg, red 0%, </style><script>alert(1)</script> 100%)',
        },
        { id: 'b', at: 100, bg: '#7c5cff' },
      ],
    });
    // The output's CSS block sits between the opening <style> and the
    // single legitimate </style>. The breakout sequence must not
    // appear inside that block in any form.
    const cssBlock = out.slice(out.indexOf('<style>'), out.lastIndexOf('</style>'));
    expect(cssBlock).not.toMatch(/<\/style/i);
    expect(cssBlock).not.toContain('<script');
    // The user's bg DID reach the generator (the `linear-gradient(`
    // wrapper survives) — but every `<` and `>` inside the value has
    // been stripped by the value-side CSS sanitiser, defanging the
    // breakout entirely. No encoded marker, no original — just gone.
    expect(cssBlock).toContain('linear-gradient(45deg, red 0%');
  });

  it('strips invalid characters from custom selector / className', () => {
    const out = generateHtml(cfg, { className: '"><img src=x onerror=alert(1)' });
    expect(out).toContain('class="animated"');
    expect(out).not.toContain('onerror=');
  });
});

describe('cssVars round-trip — non-CSS generators', () => {
  // The cssVars option is wired through SCSS, styled-components, and
  // animated-SVG (the four CSS-flavoured outputs). This suite asserts
  // each one emits the longhand animation-* properties + the
  // --ah-* declarations, mirroring the generateCss test coverage so
  // any future drift (a generator that quietly stops accepting
  // cssVars) trips a test instead of silently shipping the literal
  // form.

  it('generateScss emits the longhand animation properties + --ah-* vars', async () => {
    const { generateScss } = await import('@/lib/generateScss');
    const out = generateScss(cfg, { cssVars: true });
    expect(out).toContain('--ah-duration:');
    expect(out).toContain('--ah-easing:');
    expect(out).toContain('--ah-iterations:');
    expect(out).toContain('animation-name: play;');
    expect(out).toContain('animation-duration: var(--ah-duration);');
    expect(out).toContain('animation-iteration-count: var(--ah-iterations);');
    expect(out).not.toMatch(/^\s*animation:\s/m);
  });

  it('generateStyledComponents replaces the name token with ${play} on cssVars longhand', async () => {
    const { generateStyledComponents } = await import(
      '@/lib/generateStyledComponents'
    );
    const out = generateStyledComponents(cfg, { cssVars: true });
    expect(out).toContain('--ah-duration:');
    // Crucial: the keyframes ref is interpolated even on the
    // longhand animation-name property — the rewrite has to handle
    // both `animation:` and `animation-name:` shapes.
    expect(out).toContain('animation-name: ${play};');
    expect(out).toContain('animation-duration: var(--ah-duration);');
  });

  it('generateAnimatedSvg embeds the longhands inside the SVG style block', async () => {
    const { generateAnimatedSvg } = await import('@/lib/generateAnimatedSvg');
    const out = generateAnimatedSvg(cfg, { cssVars: true });
    // Vars + longhands live inside the inline <style>. The CDATA
    // wrapper is irrelevant to property correctness here.
    expect(out).toContain('--ah-duration:');
    expect(out).toContain('animation-name: play;');
    expect(out).toContain('animation-duration: var(--ah-duration);');
  });
});
