import type { AnimationConfig } from '@/types/animation';
import { buildKeyframesBody, buildRuleDeclLines } from './generateCss';
import { hasTokenAnimations } from './tokenize';

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

  // styled.div carries only the element's own rule. Per-letter stagger
  // and per-token overrides live on `> span` (and
  // `> span[data-anim="…"]`) descendant rules that this single-element
  // template doesn't render — same scope boundary SCSS keeps. Flag it
  // honestly and point at the CSS export, which emits the complete set.
  const spanNote =
    c.target === 'text' && (c.stagger || hasTokenAnimations(c))
      ? `
// NOTE: this animation uses ${
          hasTokenAnimations(c) ? 'per-token overrides' : 'per-letter stagger'
        },
// which need per-character <span> children plus extra \`> span\`
// (and \`> span[data-anim="…"]\`) rules + their own @keyframes. The
// styled.div above only animates the element as a whole — copy the
// CSS export for the complete, ready-to-paste per-token output.`
      : '';

  return `import styled, { keyframes } from 'styled-components';

const play = keyframes\`
${keyframesBody}
\`;

export const ${name} = styled.div\`
${ruleBody}
\`;
${spanNote}`;
}
