import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // For infinite animations, the WAAPI Animation.currentTime keeps
  // accumulating forever — wrap it modulo one iteration so the playhead
  // stays inside the ruler. For finite animations the timeline shows
  // every iteration end-to-end, so we clamp to totalMs.
  //
  // We treat anything-other-than-the-literal-string-`'infinite'` as
  // infinite-from-the-timeline's-perspective when iterations isn't a
  // sensible positive integer; this guards against the iterations field
  // ever holding a stale value during config transitions.
  const isInfinite =
    config.iterations === 'infinite' ||
    !(typeof config.iterations === 'number' && config.iterations > 0);

  const displayTime = useMemo(() => {
    if (!Number.isFinite(controller.currentTime)) return 0;
    if (isInfinite && totalMs > 0) {
      const t = ((controller.currentTime % totalMs) + totalMs) % totalMs;
      return t;
    }
    return Math.max(0, Math.min(controller.currentTime, totalMs));
  }, [controller.currentTime, isInfinite, totalMs]);

  // Belt-and-suspenders: the playhead position is also clamped to
  // [0, 100] so even if some upstream regression let displayTime drift
  // past totalMs, the visual playhead never escapes the track.
  const playheadPct = useMemo(
    () =>
      Math.max(
        0,
        Math.min(100, totalMs > 0 ? (displayTime / totalMs) * 100 : 0)
      ),
    [displayTime, totalMs]
  );

  const positionFromPointer = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const ratio = (clientX - rect.left) / rect.width;
      return clampTime(ratio * totalMs, config);
    },
    [config, totalMs]
  );

  // Clicks AND drags pause the animation and seek to the pointer
  // position. Release leaves the playhead exactly where the user
  // dropped it — no auto-resume. To start playing again, hit the play
  // button (or Space). This matches user mental model: tap timeline →
  // jump to a frame; drag timeline → scrub through frames.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!controller.ready) return;
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
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
      // Stay paused — explicit user intent. The play button is the only
      // affordance for resuming.
    },
    [scrubbing]
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
      <div className="flex items-center justify-between text-[11px] px-1">
        <span className="tabular-nums text-fg font-medium">
          {formatTime(displayTime)}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 text-[10px] uppercase tracking-wider',
            scrubbing
              ? 'text-accent'
              : controller.isPlaying
                ? 'text-emerald-400'
                : 'text-fg-subtle'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              scrubbing
                ? 'bg-accent'
                : controller.isPlaying
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-fg-subtle'
            )}
          />
          {scrubbing ? 'Scrubbing' : controller.isPlaying ? 'Playing' : 'Paused'}
        </span>
        <span className="tabular-nums text-fg-muted">
          / {formatTime(totalMs)}
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-label="Timeline scrub"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalMs)}
        aria-valuenow={Math.round(displayTime)}
        aria-valuetext={formatTime(displayTime)}
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
            controller.pause();
            controller.seek(0);
            return;
          } else if (e.key === 'End') {
            e.preventDefault();
            controller.pause();
            controller.seek(totalMs);
            return;
          } else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (controller.isPlaying) controller.pause();
            else controller.play();
            return;
          }
          if (delta !== 0) {
            e.preventDefault();
            controller.pause();
            controller.seek(clampTime(controller.currentTime + delta, config));
          }
        }}
        className={cn(
          // overflow-hidden so the playhead clips at the track's edge
          // even if a future bug pushed playheadPct outside [0, 100].
          'relative h-10 rounded-lg border border-border/70 bg-bg-soft cursor-pointer focus-ring select-none touch-none overflow-hidden',
          scrubbing && 'border-accent/60 ring-2 ring-accent/30',
          !controller.ready && 'opacity-50 cursor-not-allowed'
        )}
        title="Click or drag to scrub. Hit play to resume."
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
        {/* playhead — bigger, with a circular grip on top so users
            recognise it as draggable. We render plain spans (not
            motion.span) so the position snaps to wherever the rAF tick
            put it — a spring transition was visibly overshooting on
            every iteration wrap (99% → 0% playing through ~−5%). */}
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow',
            scrubbing && 'shadow-[0_0_18px_rgb(var(--accent)/0.7)]'
          )}
          style={{ left: `${playheadPct}%` }}
        />
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow ring-2 ring-bg-panel',
            scrubbing && 'h-4 w-4 ring-accent/40'
          )}
          style={{ left: `${playheadPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-fg-subtle/70 px-1 tabular-nums select-none">
        <span>0ms</span>
        <span className="text-fg-subtle">click or drag to scrub</span>
        <span>{formatTime(totalMs)}</span>
      </div>
    </div>
  );
}
