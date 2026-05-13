import { describe, expect, it } from 'vitest';
import { generateCss } from '@/lib/generateCss';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateFramerMotion } from '@/lib/generateFramerMotion';
import { generateWaapi } from '@/lib/generateWaapi';
import { generateLottie } from '@/lib/generateLottie';
import type { AnimationConfig } from '@/types/animation';

const baseCfg: AnimationConfig = {
  target: 'shape',
  selector: '.animated',
  shape: 'square',
  iterations: 1,
  direction: 'normal',
  fill: 'forwards',
  duration: 1000,
  delay: 0,
  easing: { kind: 'preset', value: 'linear' },
  keyframes: [],
};

const SQUARE = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const TRIANGLE = 'polygon(50% 0%, 0% 100%, 100% 100%)';

const cfgWithClipPath: AnimationConfig = {
  ...baseCfg,
  keyframes: [
    { id: 'a', at: 0, clipPath: SQUARE },
    { id: 'b', at: 100, clipPath: TRIANGLE },
  ],
};

describe('clip-path keyframe engine support', () => {
  describe('generateCss', () => {
    it('emits clip-path declarations in @keyframes', () => {
      const out = generateCss(cfgWithClipPath);
      expect(out).toContain(`clip-path: ${SQUARE};`);
      expect(out).toContain(`clip-path: ${TRIANGLE};`);
    });

    it('strips declaration-breakout characters from clipPath values', () => {
      // The trust-boundary contract: untrusted CSS values can't
      // terminate the declaration or the rule. cssValueSafe strips
      // `;` `}` `<` `>` outside balanced parens — those are the only
      // ways a value can escape its declaration. Stranded characters
      // (`{`, `body`, etc.) survive but produce invalid CSS that the
      // parser silently ignores; they can't reach DOM or render
      // anything because there's no enclosing rule for them to start.
      const out = generateCss({
        ...baseCfg,
        keyframes: [
          { id: 'a', at: 0, clipPath: 'polygon(0% 0%); } body{display:none' },
          { id: 'b', at: 100, clipPath: TRIANGLE },
        ],
      });
      // Locate the emitted clip-path line and assert it carries
      // neither a stray `;` (declaration end) nor `}` (rule end)
      // inside its value. The legitimate trailing `;` that ends the
      // declaration in the @keyframes block is fine.
      const m = out.match(/clip-path:\s*([^\n]*)\n/);
      expect(m).not.toBeNull();
      const valueWithTerminator = m![1];
      // Drop the legitimate trailing terminator before inspecting
      // the value itself.
      const value = valueWithTerminator.replace(/;\s*$/, '');
      expect(value).not.toContain(';');
      expect(value).not.toContain('}');
      expect(value).not.toContain('<');
      expect(value).not.toContain('>');
    });

    it('omits clip-path declaration when the field is absent', () => {
      const out = generateCss({
        ...baseCfg,
        keyframes: [
          { id: 'a', at: 0, opacity: 0 },
          { id: 'b', at: 100, opacity: 1 },
        ],
      });
      expect(out).not.toContain('clip-path');
    });
  });

  describe('generateTailwind', () => {
    it('emits clipPath in the @keyframes config block', () => {
      const out = generateTailwind(cfgWithClipPath);
      expect(out).toContain(`clipPath: '${SQUARE}'`);
      expect(out).toContain(`clipPath: '${TRIANGLE}'`);
    });
  });

  describe('generateFramerMotion', () => {
    it('emits clipPath channel as a string array', () => {
      const out = generateFramerMotion(cfgWithClipPath);
      // Framer Motion's animate object should carry clipPath as a
      // tween-able string channel; both endpoints survive.
      expect(out).toMatch(/clipPath: \['polygon\(0% 0%, 100% 0%, 100% 100%, 0% 100%\)', 'polygon\(50% 0%, 0% 100%, 100% 100%\)'\]/);
    });
  });

  describe('generateWaapi', () => {
    it('emits clipPath in the keyframe objects', () => {
      const out = generateWaapi(cfgWithClipPath);
      expect(out).toContain(`clipPath: '${SQUARE}'`);
      expect(out).toContain(`clipPath: '${TRIANGLE}'`);
    });
  });

  describe('generateLottie', () => {
    it('reports clip-path animation as a dropped feature', () => {
      const out = generateLottie(cfgWithClipPath);
      // Lottie's schema has no clip-path primitive — generator emits
      // a comment naming the dropped capability so users aren't
      // surprised by the missing motion in After Effects / web
      // player.
      expect(out).toContain('clip-path animation');
    });
  });
});
