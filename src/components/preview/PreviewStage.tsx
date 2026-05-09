import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { useAnimationStyle } from '@/hooks/useAnimationStyle';
import { useTimelineController } from '@/hooks/useTimelineController';
import { TextTarget } from './TextTarget';
import { ShapeTarget } from './ShapeTarget';
import { SvgPathTarget } from './SvgPathTarget';
import { PlayButton, type PlayButtonState } from './PlayButton';
import { TimelinePanel } from './TimelinePanel';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo } from 'react';
import { totalDuration } from '@/lib/timing';

export function PreviewStage() {
  const config = useAnimationStore((s) => s.config);
  const { className, restart, tick } = useAnimationStyle(config);
  const controller = useTimelineController(className);
  const setPreviewTargetClassName = useUiStore(
    (s) => s.setPreviewTargetClassName
  );

  // Publish the live target's className so the visual exporter (mounted
  // elsewhere in the tree) can find the same DOM element + animation
  // without a React ref tunnel.
  useEffect(() => {
    setPreviewTargetClassName(className);
    return () => setPreviewTargetClassName(null);
  }, [className, setPreviewTargetClassName]);

  // Single source of truth for play state: the timeline controller. The
  // play button + the timeline scrubber both talk to it. Earlier
  // versions kept a separate React `paused` flag toggling an
  // `ah-paused` CSS class, which raced the controller's WAAPI pause()
  // and made the play button visibly inert when the controller had
  // just paused for scrubbing. The controller is the single owner now.
  const totalMs = useMemo(() => totalDuration(config), [config]);
  // "At end" only applies to finite-iteration animations. Infinite
  // presets never finish so the play button never goes into replay
  // mode for them. 16 ms covers typical rAF jitter at the boundary.
  const finiteIterations =
    typeof config.iterations === 'number' && config.iterations > 0;
  const atEnd =
    finiteIterations && controller.currentTime >= Math.max(0, totalMs - 16);

  const playState: PlayButtonState = !controller.ready
    ? 'paused'
    : atEnd && !controller.isPlaying
      ? 'finished'
      : controller.isPlaying
        ? 'playing'
        : 'paused';

  const replay = useCallback(() => {
    if (!controller.ready) {
      // Animation not yet attached — fall back to the className-bump
      // restart and let the controller pick the new one up.
      restart();
      return;
    }
    controller.restart();
  }, [controller, restart]);

  // Replay event from `Space`-key handler in App.tsx.
  useEffect(() => {
    const handler = () => replay();
    window.addEventListener('ah:replay', handler as EventListener);
    return () => window.removeEventListener('ah:replay', handler as EventListener);
  }, [replay]);

  const onPlayClick = () => {
    if (!controller.ready) return;
    if (atEnd) {
      controller.restart();
      return;
    }
    if (controller.isPlaying) controller.pause();
    else controller.play();
  };

  const targetEl = useMemo(() => {
    if (config.target === 'text') {
      return (
        <TextTarget
          key={tick}
          className={className}
          text={config.text ?? ''}
          stagger={config.stagger}
        />
      );
    }
    if (config.target === 'svg') {
      return (
        <SvgPathTarget
          key={tick}
          className={className}
          pathId={config.svgPath ?? 'check'}
        />
      );
    }
    return (
      <ShapeTarget
        key={tick}
        className={className}
        shape={config.shape ?? 'square'}
      />
    );
  }, [config, className, tick]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="card relative flex-1 lg:min-h-[320px] overflow-hidden p-0">
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
          className="relative z-10 flex h-full lg:min-h-[320px] items-center justify-center px-6 py-8"
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
      <div data-tour-anchor="timeline">
        <TimelinePanel controller={controller} />
      </div>
    </div>
  );
}
