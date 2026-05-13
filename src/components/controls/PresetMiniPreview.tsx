import { useEffect, useId, useMemo, useState } from 'react';
import type { AnimationConfig } from '@/types/animation';
import { generateCss } from '@/lib/generateCss';
import { useInView } from '@/hooks/useInView';
import { useUiStore } from '@/store/uiStore';
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
  const documentVisible = useUiStore((s) => s.documentVisible);
  // Disable the animation entirely (not pause) when the card is
  // off-screen or the tab is hidden. Pausing landed the animation on
  // whatever frame the IO caught — for entrance-style presets (fadeIn,
  // scaleIn, slideIn) that frame is often `opacity: 0` / `scale: 0`,
  // so the user saw empty cards. `animation: none` makes the element
  // render in its base, un-animated CSS state — which for every
  // preset target (shape, text, svg) is always visible. When the
  // card scrolls back in, the className's animation re-engages and
  // restarts from frame 0 — same as initial mount, no surprise.
  const animationDisabled = !(inView && documentVisible);

  const loopCfg = useMemo<AnimationConfig>(
    () => ({
      ...config,
      selector: `.${cls}`,
      // Preserve the preset's original iterations. Inherently-looping
      // presets (iterations: 'infinite' like wave, color-cycle) run
      // their natural continuous cycle. Finite presets (iterations:
      // 1 with fill that holds an end state — typewriter, fade-up,
      // bounce-in, etc.) play through once and then hold; we replay
      // them via the tick-bump effect below.
      //
      // Previously forced 'infinite' for every preset, which made
      // step-eased presets like typewriter snap to their visible
      // state once and then hold permanently — users saw the
      // sequential reveal only on first mount and nothing after.
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

  // Re-trigger finite presets on a steady cadence so users see the
  // animation play → hold → replay, instead of it running once at
  // mount and sitting still forever. Inherently-looping presets
  // (iterations: 'infinite') don't need this — their own cycle
  // covers continuous motion. Gated on the same in-view + tab-
  // visible flags as the animation itself so the tick doesn't
  // burn renders for off-screen cards.
  useEffect(() => {
    if (config.iterations === 'infinite') return;
    if (animationDisabled) return;
    // Replay interval = stagger fan-out (across the 3-letter mini
    // preview = 2 staggers between letters) + animation duration +
    // a 1 s hold. Floored at 800 ms so very short animations don't
    // replay before users can register the held state — that would
    // read as a flicker rather than a pleasant loop.
    const fanOut = (config.stagger?.step ?? 0) * 2;
    const replayMs = Math.max(800, config.duration + fanOut + 1000);
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, replayMs);
    return () => window.clearInterval(id);
  }, [config, animationDisabled]);

  // animation-play-state is not inherited, so the override has to land
  // on every element that carries a generated `animation` shorthand.
  // For stagger text, generateCss emits TWO separate @keyframes — one
  // on .cls (the wrapper) and one on .cls > span (each letter, where
  // the visible motion lives). Setting `animation: 'none'` on each
  // turns the override off; when re-rendered without the override the
  // className's animation re-engages from frame 0.
  const animStyle: React.CSSProperties = animationDisabled
    ? { animation: 'none' }
    : {};

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
              ...(animationDisabled ? { animation: 'none' } : null),
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

  // Two-layer wrapper: the OUTER carries the IntersectionObserver ref
  // and is stable for the lifetime of the component. The INNER carries
  // `key={tick}` so it remounts on config change to reset the
  // animation. If the ref lived on the keyed element, the IO would
  // keep observing the detached original DOM node forever after the
  // first config-driven remount (it fires once on mount via the
  // `useEffect([config])` above), the new element would never be
  // observed, and `inView` would freeze at false — exactly the
  // "nothing animates" failure mode we just hit on the live preview.
  return (
    <div
      ref={inViewRef}
      aria-hidden
      className={cn(
        'flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-bg-soft/50',
        className
      )}
    >
      <div key={tick} className="contents">
        {inner}
      </div>
    </div>
  );
}
