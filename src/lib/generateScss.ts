import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';

export type GenerateScssOptions = {
  name?: string;
  mixinName?: string;
};

/**
 * Wraps the canonical CSS output in an SCSS @mixin so consumers can reuse
 * it via `@include`. The keyframes are emitted alongside the mixin so the
 * whole snippet is self-contained.
 */
export function generateScss(
  c: AnimationConfig,
  opts: GenerateScssOptions = {}
): string {
  const name = opts.name ?? 'play';
  const mixin = opts.mixinName ?? `${name}-anim`;
  const css = generateCss(c, { name, indent: '  ' });
  // The CSS output is rule + keyframes. Split on @keyframes to wrap rule in a mixin.
  const split = css.indexOf('@keyframes');
  const ruleBlock = split >= 0 ? css.slice(0, split).trim() : css.trim();
  const keyframes = split >= 0 ? css.slice(split).trim() : '';

  // Convert the rule block (which is `selector { ... }`) into a mixin body
  const mixinBody = ruleBlock
    .replace(/^[^{]*\{/, '')
    .replace(/\}\s*$/, '')
    .trim();

  return `@mixin ${mixin} {
  ${mixinBody.replace(/\n/g, '\n  ')}
}

${keyframes}

// Apply with:
// .my-element {
//   @include ${mixin};
// }
`;
}
