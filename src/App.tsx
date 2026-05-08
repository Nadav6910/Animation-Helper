import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Shell } from '@/components/layout/Shell';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useTheme } from '@/hooks/useTheme';
import { useAccent } from '@/hooks/useAccent';
import { useUrlState } from '@/hooks/useUrlState';
import { useAnimationStore } from '@/store/animationStore';
import { CommandPalette } from '@/components/shortcuts/CommandPalette';
import { ShortcutsOverlay } from '@/components/shortcuts/ShortcutsOverlay';
import { OnboardingHint } from '@/components/onboarding/OnboardingHint';

export function App() {
  useTheme();
  useAccent();
  useUrlState();
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      const inField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable;

      // Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z work everywhere except inside text inputs
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !inField) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (inField) return;

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
    </>
  );
}
