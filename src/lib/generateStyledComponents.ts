import type { AnimationConfig } from '@/types/animation';
import { buildKeyframesBody, buildRuleDeclLines } from './generateCss';

export type GenerateStyledComponentsOptions = {
  componentName?: string;
  cssVars?: boolean;
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
  // Rewire the animation-name reference to the styled-components
  // `${play}` keyframes interpolation. In literal-shorthand mode the
  // name lives at the start of `animation:` (followed by a space); in
  // cssVars mode it's on its own `animation-name:` longhand. We
  // pattern-match both forms and only rewrite the name token, so the
  // rewrite stays robust if the shorthand layout changes again.
  const decls = buildRuleDeclLines(c, {
    name: animationName,
    indent: '  ',
    cssVars: opts.cssVars,
  });
  const namePattern = new RegExp(`\\b${animationName}\\b`);
  const ruleBody = decls
    .map((line) => {
      const trimmed = line.trimStart();
      if (
        trimmed.startsWith('animation:') ||
        trimmed.startsWith('animation-name:')
      ) {
        return line.replace(namePattern, '${play}');
      }
      return line;
    })
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
