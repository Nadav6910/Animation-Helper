import type { AnimationConfig } from '@/types/animation';
import { buildKeyframesBody, buildRuleDeclLines } from './generateCss';

export type GenerateScssOptions = {
  name?: string;
  mixinName?: string;
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
  const decls = buildRuleDeclLines(c, { name, indent: '  ' });
  const keyframesBody = buildKeyframesBody(c, { indent: '  ' });

  return `@mixin ${mixin} {
${decls.join('\n')}
}

@keyframes ${name} {
${keyframesBody}
}

// Apply with:
// .my-element {
//   @include ${mixin};
// }
`;
}
