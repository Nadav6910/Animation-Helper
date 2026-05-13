import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Tracks whether the referenced element is intersecting the viewport
 * (or a configurable root). Pause-when-offscreen pattern for repeating
 * CSS animations: returns the ref to attach to the observed element
 * and an `inView` boolean the caller flips into `animation-play-state`.
 *
 * Initial state is resolved synchronously in useLayoutEffect via
 * getBoundingClientRect vs. window bounds, before the first paint —
 * so cards mounted off-screen don't flash as running for a frame
 * before the observer callback fires. Falls back to true (always
 * animate) when IntersectionObserver isn't available; safer than
 * freezing the UI on a quirky browser.
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

  // Pre-resolve visibility before paint so off-screen mounts don't
  // animate for a frame before the observer reports. Cheap — one
  // getBoundingClientRect call per mount. Runs ONLY at mount; the IO
  // takes over for scroll updates.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const r = el.getBoundingClientRect();
    const initialInView =
      r.bottom > 0 &&
      r.right > 0 &&
      r.top < window.innerHeight &&
      r.left < window.innerWidth;
    setInView(initialInView);
  }, []);

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
