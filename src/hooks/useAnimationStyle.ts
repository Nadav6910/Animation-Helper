import { useEffect, useId, useMemo, useState } from 'react';
import type { AnimationConfig } from '@/types/animation';
import { generateCss } from '@/lib/generateCss';

/**
 * Generates a scoped class + injects the CSS produced by `generateCss` for the
 * preview. Returns a className the consumer applies to the animated element,
 * along with a `restart` callback that re-triggers the animation.
 */
export function useAnimationStyle(config: AnimationConfig) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  const className = `ah-${safeId}`;
  const animationName = `ah-anim-${safeId}`;
  const [tick, setTick] = useState(0);

  const localConfig = useMemo<AnimationConfig>(
    () => ({ ...config, selector: `.${className}` }),
    [config, className]
  );

  const css = useMemo(
    () => generateCss(localConfig, { name: animationName }),
    [localConfig, animationName]
  );

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-ah-style', className);
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [css, className]);

  const restart = () => setTick((n) => n + 1);

  return { className, restart, tick, css };
}
