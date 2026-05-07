import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Shell } from '@/components/layout/Shell';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useTheme } from '@/hooks/useTheme';
import { useAccent } from '@/hooks/useAccent';
import { useUrlState } from '@/hooks/useUrlState';

export function App() {
  useTheme();
  useAccent();
  useUrlState();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
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
  }, []);

  return (
    <>
      <Shell ready={!loading} />
      <AnimatePresence>
        {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      </AnimatePresence>
    </>
  );
}
