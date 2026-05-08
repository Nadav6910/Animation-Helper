import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Trap Tab/Shift+Tab focus within a container element while `enabled`.
 * Restores focus to the element that was active when the trap engaged
 * once `enabled` flips back to false (or the component unmounts).
 *
 * Pass an optional `initialFocus` ref for the element that should
 * receive focus when the trap engages — defaults to the container
 * itself (which must be focusable, e.g. tabIndex={-1}).
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  initialFocus?: RefObject<HTMLElement | null>
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    const container = containerRef.current;
    if (!container) return;

    // Defer focus to next tick — many parents animate in (transform /
    // opacity) and focusing too early can scroll the page weirdly.
    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocus?.current ??
        container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        container;
      target.focus({ preventScroll: true });
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('aria-hidden'));
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    container.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      container.removeEventListener('keydown', onKeyDown);
      // Return focus to the previously focused element if it's still in
      // the document — otherwise fall back to body so focus doesn't get
      // stranded on a removed node.
      const prev = previouslyFocused.current;
      if (prev && document.body.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    };
  }, [enabled, containerRef, initialFocus]);
}
