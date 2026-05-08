import { useEffect, useId, useMemo, useState } from 'react';
import type { AnimationConfig } from '@/types/animation';
import { generateCss } from '@/lib/generateCss';
import { useUiStore } from '@/store/uiStore';

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
  const slowMo = useUiStore((s) => s.slowMo);

  // Slow-mo affects only the preview (multiplies duration), never the
  // generated code that the user copies.
  const localConfig = useMemo<AnimationConfig>(
    () => ({
      ...config,
      selector: `.${className}`,
      duration: Math.round(config.duration / Math.max(slowMo, 0.01)),
      delay: Math.round(config.delay / Math.max(slowMo, 0.01)),
    }),
    [config, className, slowMo]
  );

  const css = useMemo(
    () => generateCss(localConfig, { name: animationName }),
    [localConfig, animationName]
  );

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-ah-style', className);
    // Append the pause rule so toggling `ah-paused` on the animated element
    // freezes it at its current frame without rewriting the @keyframes.
    styleEl.textContent = `${css}\n.${className}.ah-paused { animation-play-state: paused; }`;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [css, className]);

  const restart = () => setTick((n) => n + 1);

  return { className, restart, tick, css };
}
