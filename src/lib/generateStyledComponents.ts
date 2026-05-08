import type { AnimationConfig } from '@/types/animation';
import {
  buildAnimationShorthand,
  buildKeyframesBody,
  buildRuleDeclLines,
} from './generateCss';

export type GenerateStyledComponentsOptions = {
  componentName?: string;
};

/**
 * Builds a styled-components snippet that uses the `keyframes` helper for
 * the @keyframes body and inlines the rule declarations into the
 * styled.div template. Composes the shared IR helpers — no string
 * surgery on the CSS output, no risk of mis-substitution.
 */
export function generateStyledComponents(
  c: AnimationConfig,
  opts: GenerateStyledComponentsOptions = {}
): string {
  const name = opts.componentName ?? 'Animated';
  const animationName = 'play';
  const keyframesBody = buildKeyframesBody(c, { indent: '  ' });
  // Re-build the rule's declarations but rewire the animation shorthand
  // so the styled-components keyframes ref (`${play}`) lands in place of
  // the static name. Everything else (offset-path, stroke-dasharray) is
  // untouched.
  const decls = buildRuleDeclLines(c, { name: animationName, indent: '  ' });
  const animationLine = `  animation: ${buildAnimationShorthand(c, animationName)};`;
  const ruleBody = decls
    .map((line) =>
      line === animationLine
        ? line.replace(`${animationName} `, '${play} ')
        : line
    )
    .join('\n');

  return `import styled, { keyframes } from 'styled-components';

const play = keyframes\`
${keyframesBody}
\`;

export const ${name} = styled.div\`
${ruleBody}
\`;
`;
}
