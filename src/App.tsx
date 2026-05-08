import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Shell } from '@/components/layout/Shell';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useTheme } from '@/hooks/useTheme';
import { useAccent } from '@/hooks/useAccent';
import { useUrlState } from '@/hooks/useUrlState';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { CommandPalette } from '@/components/shortcuts/CommandPalette';
import { ShortcutsOverlay } from '@/components/shortcuts/ShortcutsOverlay';
import { OnboardingHint } from '@/components/onboarding/OnboardingHint';
import { GlobalToast } from '@/components/ui/GlobalToast';

export function App() {
  useTheme();
  useAccent();
  useUrlState();
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  const [loading, setLoading] = useState(true);

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
      const inOverlay = ui.paletteOpen || ui.shortcutsOpen;

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

      if (e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ah:replay'));
      } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ah:copy'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <>
      <Shell ready={!loading} />
      <AnimatePresence>
        {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      </AnimatePresence>
      <CommandPalette />
      <ShortcutsOverlay />
      {!loading && <OnboardingHint />}
      <GlobalToast />
    </>
  );
}
