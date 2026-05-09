import { describe, it, expect } from 'vitest';
import { generateAnimatedSvg } from '@/lib/generateAnimatedSvg';
import type { AnimationConfig } from '@/types/animation';

const cfg = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
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
  ...overrides,
});

describe('generateAnimatedSvg', () => {
  it('emits an XML doc with embedded CSS @keyframes', () => {
    const out = generateAnimatedSvg(cfg());
    expect(out.startsWith('<?xml')).toBe(true);
    expect(out).toContain('<svg');
    expect(out).toContain('@keyframes play');
    expect(out).toContain('animation: play');
  });

  it('renders a circle primitive for circle target', () => {
    const out = generateAnimatedSvg(cfg({ shape: 'circle' }));
    expect(out).toContain('<circle');
  });

  it('renders SVG path geometry for svg target', () => {
    const out = generateAnimatedSvg(cfg({ target: 'svg', svgPath: 'check' }));
    expect(out).toContain('<path');
    expect(out).toContain('pathLength="100"');
  });

  it('renders a <text> element for text target', () => {
    const out = generateAnimatedSvg(cfg({ target: 'text', text: 'Wow' }));
    expect(out).toContain('<text');
    expect(out).toContain('Wow');
  });

  it('escapes XML-significant characters in text content', () => {
    const out = generateAnimatedSvg(cfg({ target: 'text', text: '<&>"\'' }));
    expect(out).toContain('&lt;&amp;&gt;&quot;&apos;');
    expect(out).not.toMatch(/<text[^>]*>[^<]*<[^/]/);
  });

  it('strips the `>` from `]]>` inside CSS values so the CDATA can\'t be terminated', () => {
    const out = generateAnimatedSvg(
      cfg({
        keyframes: [
          { id: 'a', at: 0, bg: 'linear-gradient(]]> )' },
          { id: 'b', at: 100, bg: '#7c5cff' },
        ],
      })
    );
    // Scope the assertion to the CSS region only — the document's own
    // closing CDATA marker `]]>` is legitimate.
    const open = out.indexOf('<![CDATA[');
    const close = out.lastIndexOf(']]>');
    expect(open).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(open);
    const cssRegion = out.slice(open + '<![CDATA['.length, close);
    expect(cssRegion).not.toContain(']]>');
    // The user-supplied bg DID reach the generator (its other tokens
    // survive) — only the breakout char `>` is stripped by the
    // value-side sanitiser. `]] ` (with the gap left by removing `>`)
    // is still inside `linear-gradient(...)`.
    expect(cssRegion).toContain('linear-gradient(]] )');
  });
});
