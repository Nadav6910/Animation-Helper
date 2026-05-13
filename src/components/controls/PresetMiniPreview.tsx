import { useEffect, useId, useMemo, useState } from 'react';
import type { AnimationConfig } from '@/types/animation';
import { generateCss } from '@/lib/generateCss';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/cn';

type Props = {
  config: AnimationConfig;
  className?: string;
};

// Stable reference so useInView doesn't tear down + re-create the
// observer on every render. 100 px rootMargin gives ~1.5 card-heights
// of warm-up before the card scrolls into view — hides the off→on
// transition under scroll momentum without keeping a huge buffer
// running on small mobile viewports.
const PRESET_PREVIEW_IO_OPTIONS: IntersectionObserverInit = {
  rootMargin: '100px',
};

/**
 * A small, self-contained looping preview of a preset. Renders a tiny stage
 * with a square / circle / dot / letter and applies the preset's generated
 * CSS scoped to a unique class.
 */
export function PresetMiniPreview({ config, className }: Props) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cls = `ahmp-${safeId}`;
  const animName = `ahmp-${safeId}-anim`;
  const [tick, setTick] = useState(0);
  // Pause the looping animation while this card is scrolled out of the
  // gallery viewport. Each preset card runs its own infinite CSS
  // animation; with ~10-20 cards in a category, half off-screen at any
  // time, this cuts continuous compositor work for content the user
  // can't see. Pause is via animation-play-state so the cards stay
  // mounted (snap to current frame on scroll-into-view).
  const [inViewRef, inView] = useInView<HTMLDivElement>(
    PRESET_PREVIEW_IO_OPTIONS
  );
  const playState = inView ? 'running' : 'paused';

  const loopCfg = useMemo<AnimationConfig>(
    () => ({
      ...config,
      selector: `.${cls}`,
      iterations: 'infinite',
    }),
    [config, cls]
  );

  const css = useMemo(
    () => generateCss(loopCfg, { name: animName }),
    [loopCfg, animName]
  );

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-ahmp', cls);
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [css, cls]);

  // restart whenever config identity changes
  useEffect(() => {
    setTick((n) => n + 1);
  }, [config]);

  // animation-play-state is not inherited, so it has to land on every
  // element that carries a generated `animation` shorthand. For
  // stagger text, generateCss emits TWO separate @keyframes — one on
  // .cls (the wrapper, usually empty / decorative) and one on .cls > span
  // (each letter, where the visible motion lives). Paused play-state
  // therefore has to be set on each span as well as on the wrapper —
  // the wrapper alone wouldn't stop the per-letter animations.
  const animStyle: React.CSSProperties = { animationPlayState: playState };

  let inner: React.ReactNode;
  if (config.target === 'text') {
    const letters = (config.text ?? 'Aa').slice(0, 3).split('');
    inner = (
      <div
        className={`${cls} font-display text-base font-semibold flex gap-[1px]`}
        style={animStyle}
      >
        {letters.map((ch, i) => (
          <span
            key={i}
            style={{
              ['--i' as never]: String(i),
              animationPlayState: playState,
            } as React.CSSProperties}
          >
            {ch}
          </span>
        ))}
      </div>
    );
  } else if (config.target === 'svg') {
    inner = (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        className={cls}
        style={animStyle}
      >
        <path
          d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={60}
        />
      </svg>
    );
  } else {
    const shape = config.shape ?? 'square';
    inner = (
      <div
        className={cn(
          cls,
          'h-5 w-5 bg-accent',
          shape === 'circle' ? 'rounded-full' : 'rounded-md'
        )}
        style={animStyle}
      />
    );
  }

  return (
    <div
      ref={inViewRef}
      key={tick}
      aria-hidden
      className={cn(
        'flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-bg-soft/50',
        className
      )}
    >
      {inner}
    </div>
  );
}
