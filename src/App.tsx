import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

// Shell pulls in ControlsPanel + PreviewStage + CodePanel and ~all
// their Framer Motion children — parsing it during the splash window
// is what was driving TBT to 1.15 s. Lazy-load it: while the splash
// runs, the Shell chunk downloads in parallel; once `loading` flips
// false the chunk is (usually) already in flight or cached, so the
// suspense fallback resolves to the rendered Shell within a few ms.
const Shell = lazy(() =>
  import('@/components/layout/Shell').then((m) => ({ default: m.Shell }))
);
import { useTheme } from '@/hooks/useTheme';
import { useAccent } from '@/hooks/useAccent';
import { useUrlState } from '@/hooks/useUrlState';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { GlobalToast } from '@/components/ui/GlobalToast';
import { UpdateToast } from '@/components/ui/UpdateToast';

// Modals are lazy-loaded — none of them are needed for the initial
// paint or the first-interaction surface. Splitting them off shaves
// ~30-40 kB gzipped from the main bundle and gets us to TTI faster
// (significant Lighthouse Performance bump). The Suspense fallback is
// `null` because each modal is conditionally rendered already; a brief
// blank instant before the chunk lands is invisible to the user since
// nothing was on screen yet.
const CommandPalette = lazy(() =>
  import('@/components/shortcuts/CommandPalette').then((m) => ({
    default: m.CommandPalette,
  }))
);
const ShortcutsOverlay = lazy(() =>
  import('@/components/shortcuts/ShortcutsOverlay').then((m) => ({
    default: m.ShortcutsOverlay,
  }))
);
const OnboardingTour = lazy(() =>
  import('@/components/onboarding/OnboardingTour').then((m) => ({
    default: m.OnboardingTour,
  }))
);
const ExportModal = lazy(() =>
  import('@/components/code/ExportModal').then((m) => ({
    default: m.ExportModal,
  }))
);

export function App() {
  useTheme();
  useAccent();
  useUrlState();
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  const [loading, setLoading] = useState(true);

  // Prefetch the Shell chunk a moment into the splash so it's parsed
  // and cached by the time `loading` flips false — avoids a blank
  // gap between splash exit and Shell mount. Delayed ~600 ms so the
  // LoadingScreen's first frames get unblocked main-thread time;
  // the prefetch then runs while the splash is mid-cycle.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = window.setTimeout(() => {
      void import('@/components/layout/Shell');
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  // One-time migration: a previous build persisted slow-mo in localStorage,
  // which meant a stray ½× from a debugging session followed users back on
  // every reload and made the default duration feel slower. Slow-mo is now
  // session-only, so clear the legacy key so it can't keep haunting them.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem('ah:slowmo');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      const inField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable;
      const ui = useUiStore.getState();
      const inOverlay =
        ui.paletteOpen || ui.shortcutsOpen || ui.tourOpen || ui.exportOpen;

      // Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z work everywhere except inside text
      // inputs and inside open overlays (the overlay's input has its own
      // focus / undo expectations).
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'z' &&
        !inField &&
        !inOverlay
      ) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (inField || inOverlay) return;

      // When the mobile sheet covers the preview entirely, the stage
      // is paused and out of view — replay / scrub hotkeys would restart
      // or seek an invisible animation, defeating the occlusion pause
      // and confusing the play-state on un-occlusion. Copy stays
      // allowed since it touches code, not the stage.
      const stageOccluded = ui.stageOccluded;
      if (stageOccluded && (e.code === 'Space' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ah:replay'));
      } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ah:copy'));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Timeline scrub nudge — small step by default, larger jump
        // with shift. The TimelinePanel handles the seek; we just
        // dispatch the intent so the global handler doesn't need to
        // know whether the panel is mounted.
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        const deltaMs = direction * (e.shiftKey ? 1000 : 100);
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent('ah:scrub-nudge', { detail: { deltaMs } })
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <>
      {/* Shell is lazy: its chunk downloads in parallel with the
          splash, then mounts as soon as `loading` flips false. Until
          then we render nothing in the shell slot — the LoadingScreen
          owns the viewport. Suspense fallback is null since the
          splash is already covering anyway. */}
      <Suspense fallback={null}>
        {!loading && <Shell ready />}
      </Suspense>
      <AnimatePresence>
        {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      </AnimatePresence>
      <Suspense fallback={null}>
        <CommandPalette />
        <ShortcutsOverlay />
        <ExportModal />
        {!loading && <OnboardingTour />}
      </Suspense>
      <GlobalToast />
      <UpdateToast />
    </>
  );
}
