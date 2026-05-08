import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Live controller for the CSS animation attached to a uniquely-classed
 * element. Modern browsers expose all running animations via
 * `Element.getAnimations()`, and the returned `Animation` object exposes
 * a writable `currentTime` plus `play()` / `pause()` that work even for
 * animations declared with `animation:` shorthand. This hook wraps that
 * surface so the new TimelinePanel can scrub the preview without
 * re-implementing interpolation in JS.
 *
 * The hook polls for the animation on every render where a `className`
 * is provided — animations don't always exist on first paint (the
 * element may not be styled yet, or the animation may have been
 * recreated by a `key={tick}` remount in `useAnimationStyle`). The
 * controller simply caches the current `Animation` and refreshes it on
 * demand.
 */
export type TimelineController = {
  /** Current playhead in milliseconds, mirroring `Animation.currentTime`. */
  currentTime: number;
  /** True when the underlying animation is in the `'running'` play-state. */
  isPlaying: boolean;
  /** True when the controller has resolved a real Animation. UI should
   *  show its scrub head as disabled until this flips. */
  ready: boolean;
  play: () => void;
  pause: () => void;
  /** Move the animation's currentTime; safe to call regardless of play state. */
  seek: (ms: number) => void;
  /** Jump to the start and resume playback (the equivalent of clicking
   *  "Replay" in the preview). */
  restart: () => void;
};

const CSS_ANIMATION_PREFIX = 'ah-anim-';

/** Pull the user-animation off an element. We name every preview animation
 *  `ah-anim-<id>` in `useAnimationStyle`, so we can ignore Framer Motion's
 *  WAAPI ticks and other UI animations on the same element.
 *
 *  `animationName` only lives on `CSSAnimation` (a subclass of `Animation`),
 *  hence the duck-typed access — TypeScript's lib.dom doesn't always ship
 *  the subclass type. */
function findUserAnimation(el: HTMLElement | SVGElement | null): Animation | null {
  if (!el || typeof el.getAnimations !== 'function') return null;
  const animations = el.getAnimations();
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

export function useTimelineController(className: string | null): TimelineController {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const animRef = useRef<Animation | null>(null);
  const rafRef = useRef<number | null>(null);

  // Resolve the underlying Animation. Re-runs whenever className changes
  // (e.g. after `useAnimationStyle.restart()` increments the tick and the
  // target component remounts). A short retry loop covers the case where
  // the element is in the DOM but the browser hasn't attached the
  // animation yet.
  useEffect(() => {
    if (!className) {
      animRef.current = null;
      setReady(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`.${className}`);
      const anim = findUserAnimation(el);
      if (anim) {
        animRef.current = anim;
        setReady(true);
        setIsPlaying(anim.playState === 'running');
        return;
      }
      attempts += 1;
      if (attempts < 20) {
        // up to ~333 ms of retries — covers slow first paint without
        // pinning the main thread.
        window.setTimeout(tryFind, 16);
      }
    };
    tryFind();
    return () => {
      cancelled = true;
    };
  }, [className]);

  // While the animation is running, mirror its currentTime onto React
  // state via rAF so the playhead UI tracks live playback. When paused
  // we don't need to tick — `seek()` updates the state directly.
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const anim = animRef.current;
      if (anim && typeof anim.currentTime === 'number') {
        setCurrentTime(anim.currentTime);
        // If the animation finished naturally, stop polling and reflect
        // the final state.
        if (anim.playState === 'finished') {
          setIsPlaying(false);
          rafRef.current = null;
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
  }, [isPlaying]);

  const play = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.pause();
    setIsPlaying(false);
    if (typeof anim.currentTime === 'number') setCurrentTime(anim.currentTime);
  }, []);

  const seek = useCallback((ms: number) => {
    const anim = animRef.current;
    if (!anim) return;
    anim.currentTime = ms;
    setCurrentTime(ms);
  }, []);

  const restart = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.currentTime = 0;
    anim.play();
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  return { currentTime, isPlaying, ready, play, pause, seek, restart };
}
