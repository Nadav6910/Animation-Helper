import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimationStore } from '@/store/animationStore';
import type { TimelineController } from '@/hooks/useTimelineController';
import { clampTime, formatTime, totalDuration } from '@/lib/timing';
import { cn } from '@/lib/cn';

type Props = {
  controller: TimelineController;
};

/**
 * Compute a sensible tick interval for the ruler. Targets 6–10 ticks
 * across the track regardless of total duration, snapping to a friendly
 * round number so labels read naturally.
 */
function tickStep(totalMs: number): number {
  const candidates = [50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  const target = totalMs / 8;
  for (const c of candidates) {
    if (c >= target) return c;
  }
  return candidates[candidates.length - 1];
}

export function TimelinePanel({ controller }: Props) {
  const config = useAnimationStore((s) => s.config);
  const totalMs = useMemo(() => totalDuration(config), [config]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef = useRef(false);
  const [scrubbing, setScrubbing] = useState(false);

  const step = useMemo(() => tickStep(totalMs), [totalMs]);
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= totalMs; t += step) out.push(t);
    if (out[out.length - 1] !== totalMs) out.push(totalMs);
    return out;
  }, [totalMs, step]);

  const sortedKeyframes = useMemo(
    () => [...config.keyframes].sort((a, b) => a.at - b.at),
    [config.keyframes]
  );

  // Map the scrub head position to a percentage of total. While the
  // animation iterates inside one cycle the controller's currentTime
  // wraps; we surface the wall-clock position by including delay.
  const playheadPct = totalMs > 0 ? (controller.currentTime / totalMs) * 100 : 0;

  const positionFromPointer = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const ratio = (clientX - rect.left) / rect.width;
      return clampTime(ratio * totalMs, config);
    },
    [config, totalMs]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!controller.ready) return;
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      wasPlayingRef.current = controller.isPlaying;
      controller.pause();
      setScrubbing(true);
      controller.seek(positionFromPointer(e.clientX));
    },
    [controller, positionFromPointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbing) return;
      controller.seek(positionFromPointer(e.clientX));
    },
    [controller, positionFromPointer, scrubbing]
  );

  const endScrub = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbing) return;
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      setScrubbing(false);
      // Resume only if playback was running before the user grabbed the
      // playhead — otherwise leave the preview frozen at the scrubbed time.
      if (wasPlayingRef.current) controller.play();
    },
    [controller, scrubbing]
  );

  // Arrow-key nudge support — wired in App.tsx via a custom event so the
  // global keyboard handler doesn't have to know about this component.
  useEffect(() => {
    const onNudge = (event: Event) => {
      if (!controller.ready) return;
      const detail = (event as CustomEvent<{ deltaMs: number }>).detail;
      const next = clampTime(controller.currentTime + detail.deltaMs, config);
      controller.pause();
      controller.seek(next);
    };
    window.addEventListener('ah:scrub-nudge', onNudge as EventListener);
    return () =>
      window.removeEventListener('ah:scrub-nudge', onNudge as EventListener);
  }, [controller, config]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] text-fg-subtle px-1">
        <span className="tabular-nums">{formatTime(controller.currentTime)}</span>
        <span className="text-fg-muted">
          {scrubbing ? 'Scrubbing' : controller.isPlaying ? 'Playing' : 'Paused'}
        </span>
        <span className="tabular-nums">{formatTime(totalMs)}</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-label="Timeline scrub"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalMs)}
        aria-valuenow={Math.round(controller.currentTime)}
        aria-valuetext={formatTime(controller.currentTime)}
        tabIndex={controller.ready ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onKeyDown={(e) => {
          if (!controller.ready) return;
          let delta = 0;
          if (e.key === 'ArrowLeft') delta = e.shiftKey ? -1000 : -100;
          else if (e.key === 'ArrowRight') delta = e.shiftKey ? 1000 : 100;
          else if (e.key === 'Home') {
            e.preventDefault();
            controller.seek(0);
            return;
          } else if (e.key === 'End') {
            e.preventDefault();
            controller.seek(totalMs);
            return;
          }
          if (delta !== 0) {
            e.preventDefault();
            controller.pause();
            controller.seek(clampTime(controller.currentTime + delta, config));
          }
        }}
        className={cn(
          'relative h-9 rounded-lg border border-border/70 bg-bg-soft cursor-pointer focus-ring select-none',
          !controller.ready && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* tick marks */}
        {ticks.map((t) => {
          const pct = totalMs > 0 ? (t / totalMs) * 100 : 0;
          const isEdge = t === 0 || t === totalMs;
          return (
            <span
              key={t}
              aria-hidden
              className={cn(
                'absolute top-0 bottom-0 w-px bg-border/60',
                isEdge && 'bg-border-strong/80'
              )}
              style={{ left: `${pct}%` }}
            />
          );
        })}
        {/* keyframe markers — small chips above the ruler */}
        {sortedKeyframes.map((k) => {
          // Each keyframe's `at` is a percentage of the duration *within*
          // one iteration; the ruler shows wall-clock from 0..totalMs, so
          // multiply by config.duration and add config.delay.
          const wallMs =
            (config.delay > 0 ? config.delay : 0) +
            (k.at / 100) * (config.duration > 0 ? config.duration : 0);
          const pct = totalMs > 0 ? (wallMs / totalMs) * 100 : 0;
          return (
            <span
              key={k.id}
              aria-hidden
              className="absolute top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-fg-subtle/80"
              style={{ left: `${pct}%` }}
              title={`Keyframe at ${k.at}%`}
            />
          );
        })}
        {/* progress fill */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-accent/15"
          style={{ width: `${playheadPct}%` }}
        />
        {/* playhead */}
        <motion.span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-7 w-1 rounded-full bg-accent shadow-glow',
            scrubbing && 'h-8 shadow-[0_0_18px_rgb(var(--accent)/0.7)]'
          )}
          style={{
            left: `${playheadPct}%`,
            x: '-50%',
            y: '-50%',
          }}
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        />
      </div>
    </div>
  );
}
