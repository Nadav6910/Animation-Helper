import { describe, it, expect } from 'vitest';
import { generateHtml } from '@/lib/generateHtml';
import { generateScss } from '@/lib/generateScss';
import { generateWaapi } from '@/lib/generateWaapi';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateStyledComponents } from '@/lib/generateStyledComponents';
import { generateAnimatedSvg } from '@/lib/generateAnimatedSvg';
import type { AnimationConfig } from '@/types/animation';

const text = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
  target: 'text',
  selector: '.animated',
  text: 'Hi there',
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
  ...overrides,
});

describe('generateHtml — per-token markup mirrors TextTarget', () => {
  it('letter mode: one span per code point, carrying --i and data-anim', () => {
    const html = generateHtml(
      text({ text: 'Hi', tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }] })
    );
    expect(html).toContain('<span style="display:inline-block;--i:0" data-anim="text-wave">H</span>');
    expect(html).toContain('<span style="display:inline-block;--i:1">i</span>');
  });

  it('word mode: whitespace token gets white-space:pre and is not collapsed', () => {
    const html = generateHtml(
      text({
        tokenizeMode: 'word',
        tokenAnimations: [{ tokens: [2], presetId: 'text-wave' }],
      })
    );
    expect(html).toContain('--i:0">Hi</span>');
    expect(html).toContain('white-space:pre">');
    expect(html).toContain('--i:2" data-anim="text-wave">there</span>');
  });

  it('escapes a hostile presetId in the data-anim attribute', () => {
    const html = generateHtml(
      text({ text: 'A', tokenAnimations: [{ tokens: [0], presetId: 'x"><b' }] })
    );
    expect(html).not.toContain('data-anim="x"><b"');
    expect(html).toContain('data-anim="x&quot;&gt;&lt;b"');
  });

  it('no spans when neither stagger nor per-token is set', () => {
    const html = generateHtml(text());
    expect(html).not.toContain('--i:0');
    expect(html).toContain('>Hi there</p>');
  });
});

describe('per-token format-limitation notes', () => {
  const cfg = text({ tokenAnimations: [{ tokens: [0], presetId: 'text-wave' }] });

  it('SCSS points at the CSS export for per-token', () => {
    const out = generateScss(cfg);
    expect(out).toContain('per-token overrides');
    expect(out).toContain('CSS export');
  });

  it('styled-components flags the single-element limitation', () => {
    const out = generateStyledComponents(cfg);
    expect(out).toContain('per-token overrides');
    expect(out).toContain('CSS export');
  });

  it('animated-SVG emits an XML note comment', () => {
    const out = generateAnimatedSvg(cfg);
    expect(out).toContain('<!-- Note:');
    expect(out).toContain('per-token overrides');
  });

  it('WAAPI header reflects per-token vs stagger', () => {
    expect(generateWaapi(cfg)).toContain('per-token text');
    expect(generateWaapi(text({ stagger: { step: 50 } }))).toContain(
      'per-letter stagger'
    );
  });

  it('Tailwind header + split example track stagger/mode', () => {
    // per-token only, letter mode
    const t1 = generateTailwind(cfg);
    expect(t1).toContain('Per-token text');
    expect(t1).toContain("[...'Animate'].map");
    expect(t1).toContain('PER-TOKEN overrides');
    // word mode → word-split example
    const t2 = generateTailwind(
      text({ tokenizeMode: 'word', stagger: { step: 40 } })
    );
    expect(t2).toContain('Per-letter stagger');
    expect(t2).toContain('.split(/(\\s+)/)');
  });
});
