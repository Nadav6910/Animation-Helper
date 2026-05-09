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

/** Pull the user-animation off an element. We name every preview animation
 *  `ah-anim-<id>` in `useAnimationStyle`, so we can ignore Framer Motion's
 *  WAAPI ticks and other UI animations on the same element. */
function findUserAnimation(el: Element | null): Animation | null {
  if (!el || typeof (el as HTMLElement).getAnimations !== 'function') return null;
  const animations = (el as HTMLElement).getAnimations();
  for (const a of animations) {
    const name = (a as Animation & { animationName?: string }).animationName;
    if (name && name.startsWith(CSS_ANIMATION_PREFIX)) {
      return a;
    }
  }
  // Fallback: if the browser doesn't expose `animationName` on the
  // Animation object (older Safari), assume the first animation is ours
  // — the only animations on the target element should be the user's.
  return animations[0] ?? null;
}

function liveAnimation(className: string | null): Animation | null {
  if (!className || typeof document === 'undefined') return null;
  const el = document.querySelector(`.${className}`);
  return findUserAnimation(el);
}

export function useTimelineController(className: string | null): TimelineController {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number | null>(null);

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
      const anim = liveAnimation(className);
      if (anim) {
        setReady(true);
        // Sync initial play state to whatever the animation has — CSS
        // animations created from `animation: …` start in 'running'
        // unless the rule sets `animation-play-state: paused`.
        setIsPlaying(anim.playState === 'running');
        if (typeof anim.currentTime === 'number') {
          setCurrentTime(anim.currentTime);
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

  // While the animation is running, mirror its currentTime onto React
  // state via rAF so the playhead UI tracks live playback. We re-fetch
  // the animation on every tick — cheap, and fully insulates us from
  // any CSS regeneration that swapped the underlying Animation out.
  useEffect(() => {
    if (!isPlaying || !className) return;
    const tick = () => {
      const anim = liveAnimation(className);
      if (anim && typeof anim.currentTime === 'number') {
        setCurrentTime(anim.currentTime);
        if (anim.playState === 'finished') {
          setIsPlaying(false);
          return;
        }
        if (anim.playState === 'paused') {
          // Something else paused us (browser tab background, devtools,
          // etc.). Reflect that in the controller state.
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
    const anim = liveAnimation(className);
    if (!anim) return;
    anim.play();
    setIsPlaying(true);
  }, [className]);

  const pause = useCallback(() => {
    const anim = liveAnimation(className);
    if (!anim) return;
    anim.pause();
    setIsPlaying(false);
    if (typeof anim.currentTime === 'number') setCurrentTime(anim.currentTime);
  }, [className]);

  const seek = useCallback(
    (ms: number) => {
      const anim = liveAnimation(className);
      if (!anim) {
        // Even without a live animation, surface the requested time so
        // the UI reflects the user's intent immediately.
        setCurrentTime(ms);
        return;
      }
      anim.currentTime = ms;
      setCurrentTime(ms);
    },
    [className]
  );

  const restart = useCallback(() => {
    const anim = liveAnimation(className);
    if (!anim) return;
    anim.currentTime = 0;
    anim.play();
    setCurrentTime(0);
    setIsPlaying(true);
  }, [className]);

  return { currentTime, isPlaying, ready, play, pause, seek, restart };
}
