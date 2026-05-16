import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { useAnimationStyle } from '@/hooks/useAnimationStyle';
import { useTimelineController } from '@/hooks/useTimelineController';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TextTarget } from './TextTarget';
import { ShapeTarget } from './ShapeTarget';
import { SvgPathTarget } from './SvgPathTarget';
import { PlayButton, type PlayButtonState } from './PlayButton';
import { TimelinePanel } from './TimelinePanel';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { hasMeaningfulAnimation, totalDuration } from '@/lib/timing';

export function PreviewStage() {
  const config = useAnimationStore((s) => s.config);
  const { className, restart, tick } = useAnimationStyle(config);
  // The controller now mirrors the live WAAPI Animation's state every
  // frame, so it sees config-driven Animation replacements (preset,
  // start-blank, target swap, slider) without needing a sync token.
  // `restart` is the missing-animation fallback: when getAnimations()
  // is empty (finite + fill:none after-phase), play / restart bump
  // the className so a fresh Animation attaches and the tick follows.
  const controller = useTimelineController(className, restart);
  const setPreviewTargetClassName = useUiStore(
    (s) => s.setPreviewTargetClassName
  );
  const tourOpen = useUiStore((s) => s.tourOpen);
  const stageOccluded = useUiStore((s) => s.stageOccluded);
  const documentVisible = useUiStore((s) => s.documentVisible);

  // When the mobile sheet covers the stage entirely (snap === 'full'),
  // the WAAPI animation keeps ticking compositor work for a preview
  // the user can't see. Pause via the controller when occluded; resume
  // only if it WAS playing when we paused, so a user who'd manually
  // paused before opening the sheet doesn't see it auto-resume. Done
  // via the controller (not via CSS animation-play-state) so the play
  // button's React state stays in sync with the WAAPI state.
  const stageMountedRef = useRef(true);
  useEffect(() => {
    stageMountedRef.current = true;
    return () => {
      stageMountedRef.current = false;
    };
  }, []);
  // Both pause effects (occlusion + document visibility) share one
  // safe-to-resume gate: only call controller.play() if the stage is
  // visible AND the tab is visible. The gate reads LIVE store state
  // via useUiStore.getState() because the closure-captured values
  // could be stale by the time the cleanup runs — e.g. sheet closes
  // while the tab is still minimised would otherwise resume the
  // animation behind a hidden tab.
  const resumeIfFullyVisible = useCallback(() => {
    if (!stageMountedRef.current) return;
    const ui = useUiStore.getState();
    if (!ui.documentVisible) return;
    if (ui.stageOccluded) return;
    controller.play();
  }, [controller]);

  useEffect(() => {
    if (!stageOccluded) return;
    if (!controller.isPlaying) return;
    controller.pause();
    return () => {
      // Resume-gate reads live store state so we don't play() into a
      // tab that's still hidden (or a stage that's still occluded by
      // some other gate).
      resumeIfFullyVisible();
    };
    // Reading isPlaying inside the effect captures the play state at the
    // moment occlusion began; we deliberately don't re-subscribe when
    // isPlaying flips during occlusion (it would loop pause↔play with
    // its own setIsPlaying ticks).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageOccluded]);

  // Same pattern, driven by document visibility. Browsers already
  // throttle hidden tabs hard (rAF → 1 Hz, compositor animations
  // slowed), but explicitly pausing stops React state churn from the
  // controller's rAF tick and lets the controller resume cleanly when
  // the user comes back instead of mid-iteration on a throttled clock.
  useEffect(() => {
    if (documentVisible) return;
    if (!controller.isPlaying) return;
    controller.pause();
    return () => {
      resumeIfFullyVisible();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentVisible]);
  // Timeline visibility — persisted so the user's preference survives
  // reload. Collapsing the timeline frees its vertical space for the
  // preview stage (the card has flex-1, so flexbox redistributes the
  // freed space automatically) without dropping any controller state.
  // The tour temporarily un-collapses the timeline so its
  // `data-tour-anchor` step has something to spotlight.
  const [timelineHidden, setTimelineHidden] = useLocalStorage(
    'ah:timeline-hidden',
    false
  );
  const showTimeline = !timelineHidden || tourOpen;

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
  // True when the config defines an actual visible animation (i.e.
  // at least one keyframe property differs). When false, the WAAPI
  // animation still runs but nothing moves, so playing it is a
  // no-op that just makes the timeline look misleading. We use this
  // to disable the play button + freeze the timeline UI in that
  // state, so the user gets a clear "nothing to play" affordance.
  const animated = useMemo(() => hasMeaningfulAnimation(config), [config]);
  // "At end" only applies to finite-iteration animations. Infinite
  // presets never finish so the play button never goes into replay
  // mode for them. The boundary is the smaller of 16 ms (typical rAF
  // jitter) and 5 % of the total — without the cap, a 50 ms preset
  // would treat 32 % of its run as "finished" and the button would
  // flicker to replay mid-play.
  const finiteIterations =
    typeof config.iterations === 'number' && config.iterations > 0;
  const atEndSlack = totalMs > 0 ? Math.min(16, totalMs * 0.05) : 16;
  const atEnd =
    finiteIterations && controller.currentTime >= Math.max(0, totalMs - atEndSlack);

  const playState: PlayButtonState = !controller.ready || !animated
    ? 'paused'
    : atEnd && !controller.isPlaying
      ? 'finished'
      : controller.isPlaying
        ? 'playing'
        : 'paused';

  const replay = useCallback(() => {
    // Skip when there's nothing to play. The play button visibly
    // disables itself in this state (`animated === false`); the Space
    // hotkey from App.tsx would otherwise quietly restart a no-op
    // animation, which contradicts the disabled UI.
    if (!animated) return;
    if (!controller.ready) {
      // Animation not yet attached — fall back to the className-bump
      // restart and let the controller pick the new one up.
      restart();
      return;
    }
    controller.restart();
  }, [animated, controller, restart]);

  // Replay event from `Space`-key handler in App.tsx.
  useEffect(() => {
    const handler = () => replay();
    window.addEventListener('ah:replay', handler as EventListener);
    return () => window.removeEventListener('ah:replay', handler as EventListener);
  }, [replay]);

  const onPlayClick = () => {
    if (!controller.ready) return;
    // Nothing to play — keyframes don't differ. The button visually
    // reads as disabled (gray "paused" with a muted hint elsewhere)
    // so this guard mostly stops keyboard / programmatic activations.
    if (!animated) return;
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
          tokenizeMode={config.tokenizeMode}
          tokenAnimations={config.tokenAnimations}
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
    // No `gap-3` on the parent — the gap above the timeline is animated
    // as part of the timeline's collapse (see motion.div below) so the
    // stage gets the freed pixels back when the timeline is hidden,
    // instead of staring at a permanent 12 px stub on mobile.
    <div className="flex h-full flex-col">
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
        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2.5">
          <motion.button
            type="button"
            onClick={() => setTimelineHidden((v) => !v)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-bg-panel/80 text-fg-muted backdrop-blur hover:text-fg focus-ring transition-colors"
            aria-label={timelineHidden ? 'Show timeline' : 'Hide timeline'}
            aria-pressed={!timelineHidden}
            title={timelineHidden ? 'Show timeline' : 'Hide timeline'}
          >
            {timelineHidden ? (
              <PanelBottomOpen size={15} />
            ) : (
              <PanelBottomClose size={15} />
            )}
          </motion.button>
          <PlayButton
            state={playState}
            onClick={onPlayClick}
            disabled={!animated}
          />
        </div>
      </div>
      {/* Timeline collapses into the stage with a smooth height +
          opacity transition. AnimatePresence keeps the panel mounted
          during exit so the height interpolation has a target to
          read. The stage's flex-1 absorbs the freed space. The
          data-tour-anchor stays in the DOM unconditionally so the
          onboarding tour can find it even when the user has the
          timeline collapsed (the tour also flips it open via
          `showTimeline` so the spotlight has visible content). */}
      <div data-tour-anchor="timeline">
        <AnimatePresence initial={false}>
          {showTimeline && (
            <motion.div
              key="timeline-panel"
              // marginTop animates with height so the gap above the
              // timeline collapses cleanly into the stage when hidden.
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <TimelinePanel controller={controller} animated={animated} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
