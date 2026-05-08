import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';

export type GenerateReactComponentOptions = {
  componentName?: string;
  className?: string;
};

/**
 * Single-file React component: imports, the animation CSS inlined as a
 * string, and a tiny element with the className. Drop the file straight
 * into any React project.
 */
export function generateReactComponent(
  c: AnimationConfig,
  opts: GenerateReactComponentOptions = {}
): string {
  const name = opts.componentName ?? 'AnimatedBox';
  const className = opts.className ?? 'animated';
  const css = generateCss(
    { ...c, selector: `.${className}` },
    { name: 'play' }
  );
  // JSON.stringify takes care of escaping for a JS string literal.
  const cssLiteral = JSON.stringify(css);

  return `const css = ${cssLiteral};

export function ${name}() {
  return (
    <>
      <style>{css}</style>
      <div className="${className}" />
    </>
  );
}
`;
}
