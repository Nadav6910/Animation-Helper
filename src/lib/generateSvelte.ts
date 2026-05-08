import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';

export type GenerateSvelteOptions = {
  className?: string;
};

export function generateSvelte(
  c: AnimationConfig,
  opts: GenerateSvelteOptions = {}
): string {
  const className = opts.className ?? 'animated';
  const css = generateCss({ ...c, selector: `.${className}` }, { name: 'play' });

  return `<div class="${className}"></div>

<style>
${css}
</style>
`;
}
