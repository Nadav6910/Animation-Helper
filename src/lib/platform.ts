/**
 * Detect Apple-family platforms so we can show ⌘ vs Ctrl on key chips
 * and pick the right modifier in shortcut text.
 *
 * We deliberately don't memoise the result — a Mac webview returning
 * platform "MacIntel" is a fixed string that costs nothing to read on
 * each render, and component reuse across SSR (where window is absent)
 * is cleaner this way.
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  // navigator.platform is deprecated but reliable for OS family; the
  // newer userAgentData isn't broadly shipped yet. Fall back to UA.
  const platform = navigator.platform ?? '';
  if (/Mac|iPhone|iPad|iPod/i.test(platform)) return true;
  return /Mac OS X|iPhone|iPad|iPod/i.test(navigator.userAgent ?? '');
}

/** ⌘ on Mac, Ctrl elsewhere. */
export function modKeyLabel(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/** ⇧ everywhere — kept here so callers can stay platform-agnostic. */
export const SHIFT_LABEL = '⇧';
