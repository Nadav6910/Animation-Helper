import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Live controller for the CSS animation attached to a uniquely-classed
 * element. Modern browsers expose all running animations via
 * `Element.getAnimations()`, and the returned `Animation` object exposes
 * a writable `currentTime` plus `play()` / `pause()` that work even for
 * animations declared with `animation:` shorthand.
 *
 * Earlier versions cached an `Animation` ref. That ref went stale when
 * a config change triggered the CSS rule to regenerate, after which
 * `pause()` / `play()` calls landed on a defunct Animation and the
 * play button silently did nothing. The current implementation looks
 * the live animation up off the DOM at operation time. The cost is one
 * `querySelector` per call; cheap relative to user input cadence.
 */
export type TimelineController = {
  /** Current playhead in milliseconds, mirroring `Animation.currentTime`.
   *  For infinite-iteration animations this keeps growing — the
   *  TimelinePanel wraps it modulo for display. */
  currentTime: number;
  /** True when the animation is in the `'running'` play-state. */
  isPlaying: boolean;
  /** True once the controller has resolved a real Animation. UI should
   *  show its scrub head as disabled until this flips. */
  ready: boolean;
  play: () => void;
  pause: () => void;
  /** Move the animation's currentTime; safe to call regardless of play state. */
  seek: (ms: number) => void;
  /** Jump to the start and resume playback. */
  restart: () => void;
};

const CSS_ANIMATION_PREFIX = 'ah-anim-';

/** Pull every user-animation off an element OR any of its descendants.
 *  Stagger emits one `<span>` per letter, each with its own Animation
 *  object — so the controller has to treat them as a group. play /
 *  pause / seek apply to all matching animations atomically. */
function collectUserAnimations(root: Element | null): Animation[] {
  if (!root) return [];
  const out: Animation[] = [];
  const collectFrom = (el: Element) => {
    const getter = (el as HTMLElement).getAnimations;
    if (typeof getter !== 'function') return;
    for (const a of (el as HTMLElement).getAnimations()) {
      const name = (a as Animation & { animationName?: string }).animationName;
      if (name && name.startsWith(CSS_ANIMATION_PREFIX)) {
        out.push(a);
      } else if (!name && out.length === 0) {
        // Fallback for browsers that don't expose `animationName` (older
        // Safari): include the first animation on the root so seek/pause
        // still work; later descendants ignored under the same condition.
        out.push(a);
      }
    }
  };
  collectFrom(root);
  // Stagger spans live one level deep; traverse all descendants for safety
  // (also covers any future renderer that adds more nested animated nodes).
  root.querySelectorAll('*').forEach(collectFrom);
  return out;
}

function liveAnimations(className: string | null): Animation[] {
  if (!className || typeof document === 'undefined') return [];
  const root = document.querySelector(`.${className}`);
  return collectUserAnimations(root);
}

export function useTimelineController(
  className: string | null,
  /**
   * Called when the controller wants to act on a live Animation but
   * `getAnimations()` returns empty. This happens for finite CSS
   * animations with `fill: none`: once they reach their after-phase
   * the browser removes the Animation, leaving `play()` / `restart()`
   * with nothing to bind to. The fallback is expected to remount the
   * target (a `key++` bump) so a fresh Animation attaches and the rAF
   * tick can pick it up next frame.
   */
  onMissingAnimation?: () => void
): TimelineController {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  // Latest fallback in a ref so play / restart's identities don't
  // depend on it — otherwise every tick increment in useAnimationStyle
  // would recreate these callbacks downstream.
  const fallbackRef = useRef(onMissingAnimation);
  useEffect(() => {
    fallbackRef.current = onMissingAnimation;
  }, [onMissingAnimation]);

  // Mark ready once the DOM has an animation we can talk to. Retry for
  // a short window covering first paint after element mount.
  useEffect(() => {
    if (!className) {
      setReady(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryFind = () => {
      if (cancelled) return;
      const anims = liveAnimations(className);
      const first = anims[0];
      if (first) {
        setReady(true);
        // Sync initial play state to whatever the animation has — CSS
        // animations created from `animation: …` start in 'running'
        // unless the rule sets `animation-play-state: paused`.
        setIsPlaying(first.playState === 'running');
        if (typeof first.currentTime === 'number') {
          setCurrentTime(first.currentTime);
        }
        return;
      }
      attempts += 1;
      if (attempts < 30) window.setTimeout(tryFind, 16);
    };
    tryFind();
    return () => {
      cancelled = true;
    };
  }, [className]);

  // While playing, mirror the parent (= first) animation's currentTime
  // onto React state via rAF so the playhead UI tracks live playback.
  // Re-fetch every tick so a CSS regeneration that swapped the
  // underlying Animation out can't leave the controller stale.
  useEffect(() => {
    if (!isPlaying || !className) return;
    let missingFrames = 0;
    const tick = () => {
      const anims = liveAnimations(className);
      const first = anims[0];
      if (first && typeof first.currentTime === 'number') {
        missingFrames = 0;
        setCurrentTime(first.currentTime);
        // For staggered groups (one Animation per letter) every letter
        // shares the same wall-clock currentTime but enters its
        // after-phase at a different time because of its
        // animation-delay. Only stop the playhead when EVERY animation
        // has finished — otherwise the late letters would freeze
        // mid-frame the moment the first one completes.
        if (anims.every((a) => a.playState === 'finished')) {
          setIsPlaying(false);
          return;
        }
        if (first.playState === 'paused') {
          // Something else paused us (browser tab background, devtools).
          setIsPlaying(false);
          return;
        }
      } else {
        // Animation reaped — finite CSS animations with fill:none get
        // removed from getAnimations() in their after-phase. Tolerate
        // a few empty frames (covers the brief gap of a className-bump
        // remount) before declaring playback finished; otherwise we'd
        // race the remount and prematurely flip isPlaying off.
        missingFrames += 1;
        if (missingFrames > 6) {
          setIsPlaying(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, className]);

  const play = useCallback(() => {
    const anims = liveAnimations(className);
    if (anims.length === 0) {
      // Animation gone (finite + fill:none, after-phase). Ask the host
      // to remount the target — a fresh Animation attaches and the rAF
      // tick (armed by setIsPlaying(true) below) follows it as soon as
      // it materialises.
      const fallback = fallbackRef.current;
      if (fallback) {
        fallback();
        setCurrentTime(0);
        setIsPlaying(true);
      }
      return;
    }
    // Calling play() on a finished Animation rewinds to 0 and replays,
    // so this also covers "click play after finish but before reap".
    for (const a of anims) a.play();
    setIsPlaying(true);
  }, [className]);

  const pause = useCallback(() => {
    const anims = liveAnimations(className);
    if (anims.length === 0) {
      // Nothing to pause — animation is already absent. Reflect the
      // not-playing state so the UI stays consistent.
      setIsPlaying(false);
      return;
    }
    for (const a of anims) a.pause();
    setIsPlaying(false);
    const first = anims[0];
    if (first && typeof first.currentTime === 'number') {
      setCurrentTime(first.currentTime);
    }
  }, [className]);

  const seek = useCallback(
    (ms: number) => {
      const anims = liveAnimations(className);
      if (anims.length === 0) {
        // Without a live animation we can't move the rendered element,
        // but surface the requested time on the ruler so the user's
        // intent shows. Hitting play afterward remounts via the
        // missing-animation fallback and resumes from 0.
        setCurrentTime(ms);
        return;
      }
      // Every Animation in a stagger group shares the same wall-clock
      // currentTime; setting it identically on each keeps every letter
      // at its correct stagger-offset frame for the scrubbed time.
      for (const a of anims) a.currentTime = ms;
      setCurrentTime(ms);
    },
    [className]
  );

  const restart = useCallback(() => {
    const anims = liveAnimations(className);
    if (anims.length === 0) {
      const fallback = fallbackRef.current;
      if (fallback) {
        fallback();
        setCurrentTime(0);
        setIsPlaying(true);
      }
      return;
    }
    for (const a of anims) {
      a.currentTime = 0;
      a.play();
    }
    setCurrentTime(0);
    setIsPlaying(true);
  }, [className]);

  return { currentTime, isPlaying, ready, play, pause, seek, restart };
}
