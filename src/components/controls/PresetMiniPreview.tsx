import { useEffect, useId, useMemo, useState } from 'react';
import type { AnimationConfig } from '@/types/animation';
import { generateCss } from '@/lib/generateCss';
import { cn } from '@/lib/cn';

type Props = {
  config: AnimationConfig;
  className?: string;
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

  let inner: React.ReactNode;
  if (config.target === 'text') {
    const letters = (config.text ?? 'Aa').slice(0, 3).split('');
    inner = (
      <div className={`${cls} font-display text-base font-semibold flex gap-[1px]`}>
        {letters.map((ch, i) => (
          <span key={i} style={{ ['--i' as never]: String(i) } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </div>
    );
  } else if (config.target === 'svg') {
    inner = (
      <svg viewBox="0 0 24 24" width="20" height="20" className={cls}>
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
      />
    );
  }

  return (
    <div
      key={tick}
      className={cn(
        'flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-bg-soft/50',
        className
      )}
    >
      {inner}
    </div>
  );
}
