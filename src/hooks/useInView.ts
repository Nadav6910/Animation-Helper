import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the referenced element is intersecting the viewport
 * (or a configurable root). Pause-when-offscreen pattern for repeating
 * CSS animations: returns the ref to attach to the observed element
 * and an `inView` boolean the caller flips into `animation-play-state`.
 *
 * Defaults to "in view" until the first observer callback so a server-
 * rendered or first-paint mount doesn't flash as paused. Falls back to
 * true (always animate) when IntersectionObserver isn't available —
 * safer than freezing the UI on a quirky browser.
 *
 * `options` should be a stable reference (define outside the component
 * or wrap in useMemo); changing it tears down and re-creates the
 * observer, which is wasted work on every render.
 */
export function useInView<T extends Element>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      options
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return [ref, inView];
}
