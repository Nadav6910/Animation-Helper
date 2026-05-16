import type { AnimationConfig } from '@/types/animation';
import { buildKeyframesBody, buildRuleDeclLines } from './generateCss';
import { hasTokenAnimations } from './tokenize';

export type GenerateScssOptions = {
  name?: string;
  mixinName?: string;
  cssVars?: boolean;
};

/**
 * Wraps the canonical animation rule body in an SCSS @mixin so consumers
 * can `@include play-anim;` from any rule. The keyframes block is
 * emitted alongside the mixin so the snippet is fully self-contained.
 */
export function generateScss(
  c: AnimationConfig,
  opts: GenerateScssOptions = {}
): string {
  const name = opts.name ?? 'play';
  const mixin = opts.mixinName ?? `${name}-anim`;
  const decls = buildRuleDeclLines(c, {
    name,
    indent: '  ',
    cssVars: opts.cssVars,
  });
  const keyframesBody = buildKeyframesBody(c, { indent: '  ' });

  // The @mixin only carries the element's own rule body. Per-letter
  // stagger and per-token overrides live on a `> span` descendant
  // selector that a mixin can't express in isolation — same scope
  // boundary this generator already keeps for stagger. Point users at
  // the CSS export, which emits the full descendant + @keyframes set.
  const spanNote =
    c.target === 'text' && (c.stagger || hasTokenAnimations(c))
      ? `
// NOTE: this animation uses ${
          hasTokenAnimations(c) ? 'per-token overrides' : 'per-letter stagger'
        }, which
// need \`${mixin}\`'s rule plus extra \`> span\` (and
// \`> span[data-anim="…"]\`) descendant rules + their own @keyframes.
// Copy the CSS export for that complete, ready-to-paste output.`
      : '';

  return `@mixin ${mixin} {
${decls.join('\n')}
}

@keyframes ${name} {
${keyframesBody}
}

// Apply with:
// .my-element {
//   @include ${mixin};
// }${spanNote}
`;
}
