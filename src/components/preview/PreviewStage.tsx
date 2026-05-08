import { useAnimationStore } from '@/store/animationStore';
import { useAnimationStyle } from '@/hooks/useAnimationStyle';
import { TextTarget } from './TextTarget';
import { ShapeTarget } from './ShapeTarget';
import { SvgPathTarget } from './SvgPathTarget';
import { PlayButton, type PlayButtonState } from './PlayButton';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

export function PreviewStage() {
  const config = useAnimationStore((s) => s.config);
  const { className, restart, tick } = useAnimationStyle(config);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  const replay = useCallback(() => {
    setPaused(false);
    setFinished(false);
    restart();
  }, [restart]);

  // Keep finished/paused in sync with the playback iteration count: any change
  // to iterations (e.g. the loop-forever toggle) gives the animation a fresh
  // chance to finish or run forever, so reset our derived state.
  useEffect(() => {
    setFinished(false);
  }, [config.iterations, config.duration, config.delay, tick]);

  useEffect(() => {
    const handler = () => replay();
    window.addEventListener('ah:replay', handler as EventListener);
    return () => window.removeEventListener('ah:replay', handler as EventListener);
  }, [replay]);

  const playState: PlayButtonState = finished
    ? 'finished'
    : paused
      ? 'paused'
      : 'playing';

  const onPlayClick = () => {
    if (finished) {
      replay();
      return;
    }
    setPaused((p) => !p);
  };

  const onAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    // animationend bubbles from any descendant CSS animation. Ignore events
    // that aren't the user's animation (e.g. framer-motion's WAAPI ticks or
    // small UI accents). Our generator names every user animation
    // `ah-anim-<id>` via useAnimationStyle.
    if (!e.animationName.startsWith('ah-anim-')) return;
    if (config.iterations !== 'infinite') {
      setFinished(true);
      setPaused(false);
    }
  };

  const elementClassName = cn(className, paused && 'ah-paused');

  const targetEl = useMemo(() => {
    if (config.target === 'text') {
      return (
        <TextTarget
          key={tick}
          className={elementClassName}
          text={config.text ?? ''}
          stagger={config.stagger}
        />
      );
    }
    if (config.target === 'svg') {
      return (
        <SvgPathTarget
          key={tick}
          className={elementClassName}
          pathId={config.svgPath ?? 'check'}
        />
      );
    }
    return (
      <ShapeTarget
        key={tick}
        className={elementClassName}
        shape={config.shape ?? 'square'}
      />
    );
  }, [config, elementClassName, tick]);

  return (
    <div className="card relative h-full lg:min-h-[360px] overflow-hidden p-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-spotlight"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--border) / .35) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgb(var(--border) / .35) 0 1px, transparent 1px 32px)',
          maskImage:
            'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        onAnimationEnd={onAnimationEnd}
        className="relative z-10 flex h-full lg:min-h-[360px] items-center justify-center px-6 py-8"
        style={{
          perspective: '900px',
          transformStyle: 'preserve-3d',
        }}
      >
        {targetEl}
      </motion.div>
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/70 bg-bg-panel/70 px-3 py-1 text-[11px] text-fg-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live preview
        </span>
      </div>
      <div className="absolute right-4 bottom-4 z-20">
        <PlayButton state={playState} onClick={onPlayClick} />
      </div>
    </div>
  );
}
