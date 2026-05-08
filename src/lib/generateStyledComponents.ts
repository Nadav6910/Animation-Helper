import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';

export type GenerateStyledComponentsOptions = {
  componentName?: string;
};

export function generateStyledComponents(
  c: AnimationConfig,
  opts: GenerateStyledComponentsOptions = {}
): string {
  const name = opts.componentName ?? 'Animated';
  const animName = 'play';
  const css = generateCss(c, { name: animName });
  const kfStart = css.indexOf('@keyframes');
  if (kfStart < 0) return css;
  const ruleBlock = css.slice(0, kfStart).trim();
  const keyframesBlock = css
    .slice(kfStart)
    .replace(/^@keyframes\s+\S+\s*\{/, '{')
    .trim();

  // Strip selector wrapper and pull animation declaration only
  const inner = ruleBlock
    .replace(/^[^{]*\{/, '')
    .replace(/\}\s*$/, '')
    .trim();

  return `import styled, { keyframes } from 'styled-components';

const play = keyframes\`${keyframesBlock.slice(1, -1).trim()}\`;

export const ${name} = styled.div\`
  ${inner.replace(animName, '${play}').replace(/\n/g, '\n  ')}
\`;
`;
}
