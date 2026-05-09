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
  // Latest mirrored currentTime in a ref so play() can re-pin the
  // WAAPI Animation to whatever the user last scrubbed to without
  // adding `currentTime` to play()'s deps (that would re-create the
  // callback on every rAF tick).
  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);
  // Latest fallback in a ref so play / restart's identities don't
  // depend on it — otherwise every tick increment in useAnimationStyle
  // would recreate these callbacks downstream.
  const fallbackRef = useRef(onMissingAnimation);
  useEffect(() => {
    fallbackRef.current = onMissingAnimation;
  }, [onMissingAnimation]);

  // Continuously mirror the live Animation's state to React state.
  //
  // Earlier designs ran a one-shot detection effect on syncToken
  // changes plus an rAF loop only while playing. That layered scheme
  // had two structural failure modes:
  //   1. Detection ran once after a config change, so any timing edge
  //      case (fresh Animation hadn't materialised yet, missed
  //      retry, dropped setState) left the UI permanently desynced.
  //   2. While paused, the rAF loop was off — so if a config change
  //      replaced the paused Animation with a fresh running one, the
  //      controller didn't notice. Result: play button stuck on
  //      "Play", playhead frozen at the previous time, while the new
  //      animation visibly ran.
  //
  // The always-on tick below makes the live Animation authoritative.
  // Whatever `playState` and `currentTime` it reports each frame,
  // that's what the UI reflects. No timing windows, no missed
  // sync — pause the path animation, switch presets, hit Start
  // blank, drag a slider: the very next frame brings React state in
  // line with reality. React's setState bailout makes redundant
  // updates free (same primitive value → no re-render), so the cost
  // is one querySelector + getAnimations() per frame.
  useEffect(() => {
    if (!className || typeof window === 'undefined') {
      setReady(false);
      return;
    }
    let raf = 0;
    let missingFrames = 0;
    const tick = () => {
      const anims = liveAnimations(className);
      const first = anims[0];
      if (first && typeof first.currentTime === 'number') {
        missingFrames = 0;
        setReady(true);
        const allFinished = anims.every((a) => a.playState === 'finished');
        const paused = first.playState === 'paused';
        // Only mirror currentTime when the animation is actively
        // advancing. For paused / finished states the WAAPI value
        // SHOULD be static (and equal to React's mirror) — but some
        // browsers drift the hold-time after a racy pause-then-seek
        // sequence, and mirroring that drift back to React would
        // clobber the user's scrub position right before they hit
        // play. React's mirror already reflects every explicit
        // pause / seek call we made, so leaving it alone while paused
        // is the safe move.
        if (!paused && !allFinished) {
          setCurrentTime(first.currentTime);
        }
        setIsPlaying(!allFinished && !paused);
      } else {
        // Animation reaped — finite CSS animations with fill:none get
        // removed from getAnimations() in their after-phase. Tolerate
        // a few empty frames (covers the brief gap during a className-
        // bump remount) before flagging not-playing, so we don't race
        // the remount.
        missingFrames += 1;
        if (missingFrames > 6) {
          setIsPlaying(false);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [className]);

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
    // Resume playback at the React-mirrored playhead — i.e. wherever
    // the user last scrubbed. We use THREE mechanisms because each
    // covers a different failure mode in browsers' WAAPI ↔ CSS-anim
    // interop:
    //
    //   1. Pre-`play()` `currentTime = target`. Sets hold-time on the
    //      paused animation so spec-compliant browsers resume from
    //      target out of the box.
    //
    //   2. `play()` itself — transitions to running.
    //
    //   3. Post-`play()` `startTime = timeline.currentTime - target`.
    //      For a running animation, currentTime is derived as
    //      `(timeline.currentTime - startTime) × playbackRate`, so
    //      writing startTime is the deterministic way to pin
    //      currentTime regardless of any pending-pause / hold-time
    //      drift. The currentTime setter path can be silently dropped
    //      for backward seeks during a pending-pause race; the
    //      startTime path can't (no hold-time involved). This is what
    //      finally makes scrub-then-play correct in both directions.
    const target = currentTimeRef.current;
    const validTarget =
      typeof target === 'number' && Number.isFinite(target);
    if (validTarget) {
      for (const a of anims) a.currentTime = target;
    }
    for (const a of anims) a.play();
    if (validTarget) {
      for (const a of anims) {
        const tl = a.timeline;
        const tlNow = tl ? (tl.currentTime as number | null) : null;
        if (typeof tlNow === 'number') {
          a.startTime = tlNow - target;
        } else {
          // No timeline currentTime to anchor against — fall back to
          // the currentTime setter and hope.
          a.currentTime = target;
        }
      }
    }
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
    // Same triple-pin pattern as `play()`: pre-set currentTime,
    // call play(), then re-pin via startTime to bypass any
    // pending-pause race or hold-time drift across the transition.
    // Without the post-play startTime pin, restart had the same
    // racy-browser failure mode that play() guards against —
    // currentTime sometimes wouldn't take and the animation
    // resumed from a stale position.
    for (const a of anims) a.currentTime = 0;
    for (const a of anims) a.play();
    for (const a of anims) {
      const tl = a.timeline;
      const tlNow = tl ? (tl.currentTime as number | null) : null;
      if (typeof tlNow === 'number') {
        a.startTime = tlNow;
      } else {
        a.currentTime = 0;
      }
    }
    setCurrentTime(0);
    setIsPlaying(true);
  }, [className]);

  return { currentTime, isPlaying, ready, play, pause, seek, restart };
}
